Hi

Notes
	- USE website/pumpkio9-website/ AS public when accessing files
    	- EX:
        	```
        	{
        		import { publicFile } from '../App';
        		{publicFile("images/profile.jpg")}
        	}	
        	```


Docs
	- general documented info

Frontend

	Node_modules
		- packages


	Public
		- contains general video/images
		- personal resume/images (can be easily/often updated)
		- markdown files of descriptions?

	Src
		- source code
		-->	App.js
				- general hierachy and routes

		Components
			HeroSection.js
  				- background video

  			Navbar.js
  				- navigation bar at the top/referencing

			Cards.js
				- cards section of frontpage

  			Footer.js
  				- bottom portion with extra links and resume

			Blocks
	  			Button.js
    				- describes requirements for a button (in/out-site links that change with condition)

    			CardItem.js
    				- describes requirements for a card (linkable with cover)

				PdfViewer.js
                	- describes functionality of viewing in-page PDF with example

  			Pages
  				- various sub-sites
  				Papers
  					- pages for displaying papers/presentations
  				-->	Home.js
  						- homepage
  					Interests.js
  						- personal interests
  					Spotify.js
  						- spotify program to read my last 5-10 songs played



Backend
