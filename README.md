# Harvest Billable Time

This is 1PPM:1 for January 2017. 

I built this to get a little better sense of how I spend my time at my desk. I've been keping track of how much time I send "working" (in front of my computer) and productive time that's not billed (learning, reading, networking, pro bono) for the last month or so. There's no great way in Harvest to see this kind of break-down. There's also not an easy way at a glance to see total billable time for the week or month, both of which are important for me to keep track of. 

So, as a part of [1PPM](https://medium.com/1ppm/the-1ppm-challenge-eaed5df0ef5a#.tcua87tuv), I decided to finish what I started and get this out there. 

As of this writing, this is a WIP. I will have installation and usage documentation up by 2/1/2017.

## Work log

1/6/2017 - Progress screenshot!

![Harvest billable time](https://www.dropbox.com/s/g6hy3sd7zbly3x8/progress-01-06-2017.png?dl=1)

1/5/2017 - Did some refactoring of the View object to make it a little more flexible and less overall code to add simple elements. More to do here but it's much easier to work with in general. Big big thanks to David Gilbertson for his great article on [The VanillaJS Framework](https://hackernoon.com/how-i-converted-my-react-app-to-vanillajs-and-whether-or-not-it-was-a-terrible-idea-4b14b1b2faff#.11skzmto1). Used this to clean up some of the messagesa and add better error handling for Axios. To be frank, I'm up too early and just needed a little brain stretching before the day, hence nothing too terribly productive. Next up is the week view, which I have the data for. Then, loading previous weeks!

1/3/2017 - Refactoring getDaily() to create a prepareEntry() function to store time entries consistently. Also adding in the time entry id to check if it exists or not. 

1/1/2017 - Picked back up getWeek() function and pushed that to getting the data I need. Saw that I should refactor getDaily() so getWeek() could parse and store the data the same way. Also setup this repo and met with my 1PPM buddyto make it official!