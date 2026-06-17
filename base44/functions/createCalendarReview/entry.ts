import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { reviewId } = await req.json();
    if (!reviewId) return Response.json({ error: 'reviewId is required' }, { status: 400 });

    const reviews = await base44.entities.WeeklyReview.filter({ id: reviewId });
    const review = reviews[0];
    if (!review) return Response.json({ error: 'Review not found' }, { status: 404 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    // Build start/end datetime from review_date + time_of_day
    const timeStr = review.time_of_day || '09:00';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const startDate = new Date(review.review_date + 'T' + timeStr + ':00');
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour

    const agentList = review.agents_to_review?.length > 0
      ? review.agents_to_review.join(', ')
      : 'All agents';

    const topicList = (review.topics || []).join(', ');

    const event = {
      summary: review.title || 'Weekly Agent Review',
      description: `Agents: ${agentList}\n\nTopics: ${topicList}${review.notes ? '\n\nNotes: ' + review.notes : ''}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Africa/Johannesburg',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Africa/Johannesburg',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 15 },
        ],
      },
    };

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: `Calendar API error: ${err}` }, { status: 502 });
    }

    const created = await res.json();
    return Response.json({ status: 'created', eventId: created.id, htmlLink: created.htmlLink });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});