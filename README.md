Open Layers with vertexShader & fragmentShader

This repo is for me to explore drawing **anything** on an Openlayers map using the vertexShader/fragmentShader to help me better understand shader integration in Openlayers better. Ultimately, the goal is to have animated wind vectors similar to the effect on https://www.windy.com. 

I am rendering **WIND CURRENT DATA** on an OpenLayers 7.1.0 map. Features are styled with a blue triangle whose ORIENTATION is adjusted based on the wind direction. I am also plotting a yellow circle within each triangle to demonstrate zIndex. 

CustomWebGLPointsLayer is a custom renderer utilizing a vertexShader & fragmentShader to render the data to the map. Currenty CustomWebGLPointsLayer paints a large triangle on the screen but only in certain configurations.

# How to run
- git clone 
- npm install
- npm start

# The Data 
/data/weather.json is faked weather data across the globe. Each feature has a coordinates, wind speed & wind direction included. 

# Other Stuff
This project was inspired by various Openlayers examples (https://openlayers.org/en/latest/examples/). 

If you find this repo & want to contribute/chat/criticize, feel free to reach out.