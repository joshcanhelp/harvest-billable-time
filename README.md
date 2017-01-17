# Harvest Billable Time

This is 1PPM:1 for January 2017.

I built this to get a little better sense of how I spend my time at my desk.
I've been keeping track of how much time I send "working" (in front of my computer) and productive time that's not billed (learning, reading, networking, pro bono) for the last month or so. There's no great way in Harvest to see this kind of break-down. There's also not an easy way at a glance to see total billable time for the week or month, both of which are important for me to keep track of.

So, as a part of [1PPM](https://medium.com/1ppm/the-1ppm-challenge-eaed5df0ef5a#.tcua87tuv), I decided to finish what I started and get this out there.

As of this writing, this is a WIP. I will have installation and usage documentation up by 2/1/2017.

## Work log

1/17/2017 - Longer delay than I wanted but jumping back in again for a short period. I'm finding it really hard not to dive in and refactor hugely here but I'm staying focused on features. I didn't really know how this would come together when I started but I'm getting a much better sense now that I'm in it. Most important thing right now are the features that will make this a very handy tool so I'm staying focused on that.

I added in the current week display with the status bar. I had to refactor that to allow for week or day. I ended up having two hard-coded elements in the HTML, one for week and one for day. I'm adding the status bars with JS instead of having those hard-coded as well, as they were before (that was not a design decision). Because there will only be a sinle status bar showing, either the day (current or previous) or the week, this is the right way to go. The day display will only ever show a single day and the week display can use the bar as an indication of what week we're showing. 

Progress!

![Harvest billable time](https://www.dropbox.com/s/pokseo3uakt6k5n/Screenshot%202017-01-17%2010.35.23.png?dl=1)

In thinking about where this needs to end, here is my goal in order of priority

- [Requirement] Install documentation, including authentication
- [Requirement] Load more weeks and look through the history
- [Requirement] Load individual days from a week to look at the numbers and save a total working time
- [Stretch] Add the ability to set a weekly, editable billable hours goal
- [Stretch] Refactor the various objects into their own files and process with Rollup

1/6/2017 - Progress screenshot!

![Harvest billable time](https://www.dropbox.com/s/g6hy3sd7zbly3x8/progress-01-06-2017.png?dl=1)

1/5/2017 - Did some refactoring of the View object to make it a little more flexible and less overall code to add simple elements. More to do here but it's much easier to work with in general. Big big thanks to David Gilbertson for his great article on [The VanillaJS Framework](https://hackernoon.com/how-i-converted-my-react-app-to-vanillajs-and-whether-or-not-it-was-a-terrible-idea-4b14b1b2faff#.11skzmto1). Used this to clean up some of the messages a and add better error handling for Axios. To be frank, I'm up too early and just needed a little brain stretching before the day, hence nothing too terribly productive. Next up is the week view, which I have the data for. Then, loading previous weeks!

1/3/2017 - Refactoring getDaily() to create a prepareEntry() function to store time entries consistently. Also adding in the time entry id to check if it exists or not.

1/1/2017 - Picked back up getWeek() function and pushed that to getting the data I need. Saw that I should refactor getDaily() so getWeek() could parse and store the data the same way. Also setup this repo and met with my 1PPM buddy to make it official!
