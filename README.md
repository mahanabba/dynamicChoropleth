# dynamicChoropleth to visualize changes in data over time, run over a flask application. 


Note: This data is not real, and this map can be used for any county-specific datapoints over time by editing the "Value" column in Resources/data.csv.

The data is in the form of a 5 column csv with date, county, state, id (county id to map to the geojson), and value. Date and value columns can be edited freely. 

Map features: click to select, double click county to zoom in, once zoomed in a single click on a separate county will select and pan to that county, double clicking the currently selected county will zoom out, slide bar to change date. Shift+click on a state will allow  you to select that state, as well as multiple states. Selections in the template have no purpose, but in application they can be used as a different way to select states to visualize/open more info for in a new window. 

To run: clone the repo and either type flask run or python app.py in the terminal. 
