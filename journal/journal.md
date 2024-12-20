# Card Simulator - Journal

## 2024-12-20 (Csongor)

I'm so happy that we've managed (thanks Christoph!) to get rid of the Processing "build" cycle, and that this all works now directly through GitHub Pages and a submodule logic. It just feels good to have a version that feels worth working on and updating. Yes, some of the old features (PDF generation, direct link to cards, etc.) are missing, but the new structure is awesome and easy to expand.

## 2024-12-19 (Csongor)

A short recap of yesterday's tech issues & insights. I have learned a lot in a short time. All the issues were so strangely interwined that it was really hard to sort them out.

- **submodule logic** with Git
	- it's a weird concept, not very well communicated
	- easy to misunderstand the terminology "update submodule" (sorry, but that is NOT updating!)
- **deployment & build** logic (and custom actions) on GitHub Pages
	- a hard lesson: deployment does NOT mean that GitHub uploads a full copy of the files
	- what happended? GitHub has somehow (I still have not fully understood it) NOT uploaded the XML files, they were just not there. i thought for a long time that I had not made the right path from the one repository to the other, but that was not the isse. i first had to understand this deployment issub, but also:
- **Cross Origin Request (CORS)** issues
	- what? it works when deployed via GitHub, but not locally, why?