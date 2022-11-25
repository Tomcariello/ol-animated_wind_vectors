Open Layers with vertexShader & fragmentShader

This repo is for me to explore drawing **anything** on an Openlayers map using the vertexShader/fragmentShader to help me understand shaders better. Ultimately, the goal is to have animated wind vectors similar to the effect on https://www.windy.com. 

I am rendering **WIND CURRENTS** from a local data file on an OpenLayers 7.1.0 map. Each feature is styled with a triangle whose ORIENTATION is adjusted based on the wind direction of the feature. You can see these plotted by enabling **WebGLPointsLayer** as opposed to the **CustomWebGLPointsLayer** at lines 57/58 in main.js. 

CustomWebGLPointsLayer is a custom renderer intended to utilize a vertexShader & fragmentShader to render the data. Using CustomWebGLPointsLayer results in a map with no points drawn but also no errors. 

# How to run
- git clone 
- npm install
- npm start

# The Data 
/data/weather.json is faked weather data across the globe. Each feature has a coordinates, wind speed & wind direction included.

# Other Stuff
This project was inspired by various Openlayers examples (https://openlayers.org/en/latest/examples/). 

If you find this repo & want to contribute/chat/criticize, feel free to reach out.