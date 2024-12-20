# Card Simulator

A **tool** to visualise / create / provide **brainstorming cards**.

- digital cards (browser)
- print & play PDFs (work in progress)
- a lot of links

Arrange / think / discuss!

Based on: https://bitbucket.org/csongorb/porncreator/

Curently used in:

- https://csongorb.github.io/leveldesigncards/
	- https://github.com/csongorb/leveldesigncards
- work in progress
	- **Dissecting Games**
	- **Narrative Design Porn**
	- **Interface Design Cards**

## Structure

Add **this repository** as a submodule to an **other repository** that contains the following structure:

- `/cards/cardsCategories.xml`
- `/cards/cards.xml`
- `index.html` (similar to the index.html in this repository)

The other repository is intended to be deployed via GitHub Pages, resulting in the working Card Simulator. The main idea is that the content of the cards can be easily changed by pushing to the right branch of the other repository.

Important:

- `index.html` in this repository is NOT intended to work (see above)!
- the `js-files` in this repository load some `XML-files` from the other repository
	- this **may not work locally** in your browser due to some Cross Origin Request (CORS) issues, which may cause your browser to block loading the XML-files
	- strangely / funilly (I still don't fully understand it) the system works when deployed via GitHub Pages
	- you can block CORS on your browser with a plugin

## Changelog & Journal

- [changelog](journal/changelog.md)
- [journal](journal/journal.md)
- [screenshots](journal/screenshots/)

## Credits

- **Csongor Baranyai**  
	- csongorb (at) gmail (dot) com  
	- [csongorb.com](http://www.csongorb.com)

Thanks to all the **universities / schools / institutions** where I had the opportunity to teach courses, supervise students and projects, and refine the idea of the brainstorming cards. And of course a huge thank you to all the **students** who have contributed with all their comments and critiques... and who have tolerated my experiments.

Additional design / coding:

- **Christoph Maureder**
	[christophmaureder.me/](https://christophmaureder.me/)
- **Adrian Köhlmoos**
	- [LinkedIn](https://www.linkedin.com/in/adrian-ace-k%C3%B6hlmoos-30b99212b)

## License

[![Creative Commons License](https://i.creativecommons.org/l/by-nc/4.0/88x31.png)](http://creativecommons.org/licenses/by-nc/4.0/)
This work is licensed under a [Creative Commons Attribution-NonCommercial 4.0 International License](http://creativecommons.org/licenses/by-nc/4.0/).

All other media (images, software, etc.) remain the property of their copyright holders.

