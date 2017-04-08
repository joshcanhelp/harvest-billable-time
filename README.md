# Harvest Billable Time

I built this to get a little better sense of how I spend my time at my desk. It started as a part of [1PPM](https://medium.com/1ppm/the-1ppm-challenge-eaed5df0ef5a#.tcua87tuv) but took longer than expected to get into shape. 

I've been keeping track of how much time I send "working" (in front of my computer) and productive time that's not billed (learning, reading, networking, pro bono) for the last month or so. There's no great way in Harvest to see this kind of break-down. There's also not an easy way at a glance to see total billable time for the week or month, both of which are important for me to keep track of.

This uses browser storage to keep track of saved information, such as auth data and total hours worked (if you choose to log those). While this works well to get started quickly and keep your data private, it's also a little fragile since it can be wiped clean easily and no simple way to export what's there. Also, because of how Harvest's authorization works, you have to re-auth daily. I made this a little easier by saving the auth data needed and redirecting when the auth token expires. 

Last thing to note is that this needs a valid, public URL for Harvest to authorize you so you can't run it on your local file system. If you're using Harvest, it's likely you have access to a server or have a local version running so I'm guessing this isn't going to slow many folks down. 

Enjoy!

## Install and use

On the server you'd like to run this on, pull down the latest (adjust the path you're downloading to):

`git clone git@github.com:joshcanhelp/harvest-billable-time.git ~/public_html/harvest-billable-time`

Now, open the index.html file in your browser. You should get an auth error and be given a form for your client ID. 

![Harvest billable time](https://www.dropbox.com/s/vr2cxdng92sagvd/harvest-docs-01.png?dl=1)

You get your client ID from Harvest itself like so:

1. Login and click **Settings** on the top right of the admin screen
2. Scroll down and clikc the **Authorized OAuth2 API Clients** button
3. Click the green **New Client** button 
4. Give your app a name, then drop the URL from your browser into the "Website URL" and "Redirect URI" fields. 
5. Click **Save Settings** and you should see something like this:

![Harvest billable time](https://www.dropbox.com/s/dq8gz5zuzp45lyk/Screenshot%202017-04-08%2010.04.50.png?dl=1)

Copy the Client ID number, paste it into the form from above, and click **Authorize**. You should see a screen from Harvest, click **Authorize** and you'll be redirected back to the app with today's totals showing:

![Harvest billable time](https://www.dropbox.com/s/d7s6iabyumq7431/Screenshot%202017-04-08%2010.12.20.png?dl=1)

Click on **Weeks** to see the weekly total and load more weeks:

![Harvest billable time](https://www.dropbox.com/s/6k563cev0y3e6up/Screenshot%202017-04-08%2010.14.41.png?dl=1)

One thing to note here. If you get an error when loading new weeks, it's likely because you have an archived project in your timesheet. You can re-open the project and re-load the list to see that week's data.

## Build notes

**1/17/2017** - Longer delay than I wanted but jumping back in again for a short period. I'm finding it really hard not to dive in and refactor hugely here but I'm staying focused on features. I didn't really know how this would come together when I started but I'm getting a much better sense now that I'm in it. Most important thing right now are the features that will make this a very handy tool so I'm staying focused on that.

I added in the current week display with the status bar. I had to refactor that to allow for week or day. I ended up having two hard-coded elements in the HTML, one for week and one for day. I'm adding the status bars with JS instead of having those hard-coded as well, as they were before (that was not a design decision). Because there will only be a sinle status bar showing, either the day (current or previous) or the week, this is the right way to go. The day display will only ever show a single day and the week display can use the bar as an indication of what week we're showing. 

Progress!

![Harvest billable time](https://www.dropbox.com/s/pokseo3uakt6k5n/harvest-progress-01-17-2017.png?dl=1)

In thinking about where this needs to end, here is my goal in order of priority

- [Requirement] Install documentation, including authentication
- [Requirement] Load more weeks and look through the history
- [Requirement] Load individual days from a week to look at the numbers and save a total working time
- [Stretch] Add the ability to set a weekly, editable billable hours goal
- [Stretch] Refactor the various objects into their own files and process with Rollup

**1/6/2017** - Progress screenshot!

![Harvest billable time](https://www.dropbox.com/s/g6hy3sd7zbly3x8/harvest-progress-01-06-2017.png?dl=1)

**1/5/2017** - Did some refactoring of the View object to make it a little more flexible and less overall code to add simple elements. More to do here but it's much easier to work with in general. Big big thanks to David Gilbertson for his great article on [The VanillaJS Framework](https://hackernoon.com/how-i-converted-my-react-app-to-vanillajs-and-whether-or-not-it-was-a-terrible-idea-4b14b1b2faff#.11skzmto1). Used this to clean up some of the messages a and add better error handling for Axios. To be frank, I'm up too early and just needed a little brain stretching before the day, hence nothing too terribly productive. Next up is the week view, which I have the data for. Then, loading previous weeks!

**1/3/2017** - Refactoring getDaily() to create a prepareEntry() function to store time entries consistently. Also adding in the time entry id to check if it exists or not.

**1/1/2017** - Picked back up getWeek() function and pushed that to getting the data I need. Saw that I should refactor getDaily() so getWeek() could parse and store the data the same way. Also setup this repo and met with my 1PPM buddy to make it official!
