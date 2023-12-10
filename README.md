## Important note: DCS Olympus is in alpha state. No official release has been produced yet. The first public version is planned for mid december 2023.
<img align="left" width="30" src="https://github.com/Pax1601/DCSOlympus/assets/103559271/0ecff279-a87c-4e2d-a4c7-da98c74adf38">

[**Join our Discord**](https://discord.gg/kNAQkhUHnQ)

<img align="left" width="30" src="https://github.com/Pax1601/DCSOlympus/assets/103559271/1c0dd3fd-339c-4b03-94da-3e5215b0358a">

[**YouTube**](https://www.youtube.com/@DCSOlympus)


# DCS Olympus

![alt text](https://github.com/Pax1601/DCSOlympus/blob/main/client/sample.png?raw=true)

### What is this?
DCS: Olympus is a free and open-source mod for DCS that enables dynamic real-time control through a map interface. The user is able to spawn units/groups, deploy a variety of effects such as smoke, flares, or explosions, and waypoints/tasks can be given to AI units in real-time in a way similar to a classic RTS game. 

Additionally Olympus is able to run several effects and unit behaviours beyond the core DCS offerings. This includes such things as napalm and white phosphosous explosions, or setting up AA units to fire at players and miss, and more.

It even includes Red and Blue modes which limit your view and powers to just seeing what your coalition sees, with a spawning budget you could play against your friends even with no-one in the game piloting, or have a Red commander working against a squadron of blue pilots, and/or a blue commander working with them. 

Even better it requires no client mods be installed if used on a server

The full feature list is simply too long to enumerate in a short summary but needless to say Olympus offers up a lot of unique gameplay that has previously not existed, and enhances many other elements of DCS in exciting ways 

### Installing DCS Olympus
A prebuilt installer will soon be released and available here

# Frequently Asked Questions
### Can I join up and help out with the project? ###
We are currently running towards first release in the very near future so we are not looking to add more people to the core team for the moment. However that does not mean we are not open to collaborations and help going forward, if you want to help for now we are committed to the free and open source model so feel free to check out the github, familiarize yourself with the project and maybe even start submitting pull requests for open issues.

Post-release we will be more interested in developing partnerships/collaborations with other teams/projects and potentially bringing in more team members, we will update this after release on how that will be managed!

### Can I be a beta/alpha-tester? ###
With first public release planned for the very-near future we are fully committed to the final sprint, as such we will not be formally recruiting more people to test pre-release. 

Post-release we will be eager to hear feedback of all forms and take in bug-reports, at this time after release we will begin considering bringing in more team members to test in development versions as we go.

### Do you have a roadmap? ###
We do not have a roadmap no, we have a laundry list of things we are hoping to do. 

These include but are not limited to:
1) Enhancements to helicopter play
2) More features around use of ground units
3) More unique effects and behaviours
4) ATC/AIC features
5) Usability features like unit painters etc

However we cannot commit to specific features, feature release order, or timelines, please remember this isn't our job and we work on it in our free time because we love DCS

### Does Olympus support mods? ###
Generally OIympus will not have any issues with other mods, however you may need to tell olympus about modded units in order to be able to dynamically spawn them etc

Keep in mind that any mods you do choose to spawn your players will need to have, some mod unit just appear as a su27 or leo2 etc. when a player is missing them, others can cause client crashes. So be smart about how you use them

### Is Olympus compatible with mission scripts? ###
We have tried hard to keep Olympus from interfering with other scripts, we have tested with a variety of new and old mission scripts and generally expect it will not be an issue.

However we cannot foresee everything people come up with so we suggest testing with what you have in mind once olympus releases

### How does it work? ###
The quick answer is magic. 

The long answer is well all the code is there for you to read. 

The middle answer is a bit like SRS does. Olympus consists of two parts. 

(A) Olympus back end: A dll, run by DCS, that sends data out and gets commands in via a REST API;
(B) Webserver exe: The one you start when starting the server via the desktop shortcut. 

A and B never communicate when you connect the client you download the web page and some other minor stuff from B, and you get the DCS data from and send commands to A.

### How much does Olympus impact performance? ###
Olympus by itself should not have a noticeable impact on server performance, however the ability for the user to spawn arbitrary units and command engagements means Olympus can be used in such a way that brings the game to it's knees.

Be cognizant of how you play, whether it's done through Olympus or the mission editor 500 MLRS units firing at once is not going to go over well with most servers
 
    
    
    

    
