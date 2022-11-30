import Feature from "ol/Feature";
import Map from "ol/Map";
import Point from "ol/geom/Point";
import VectorSource from "ol/source/Vector";
import Tile from "ol/layer/Tile";
import View from "ol/View";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import WebGLPointsLayer from "ol/layer/WebGLPoints";
import WebGLPointsLayerRenderer from 'ol/renderer/webgl/PointsLayer';

class CustomWebGLPointsLayer extends WebGLPointsLayer {
  createRenderer() {
    return new WebGLPointsLayerRenderer(this, { 
      // "attributes" are values that are passed into the shaders
      attributes: [
        {
          name: 'a_coords',
          callback: function(feature) {
            // This callback is executed for each feature
            
            // Create an array of the X & Y positions for GLSL.
            const coordinatesArr = [ feature.values_[0],feature.values_[1] ];

            return coordinatesArr;
          }
        },
      ],
      // These are the default Open Layers Shaders
      // https://openlayers.org/en/latest/apidoc/module-ol_webgl_PostProcessingPass-WebGLPostProcessingPass.html
      vertexShader: 
      `
      precision mediump float;

      attribute vec2 a_coords;
      varying vec2 v_texCoord;
      varying vec2 v_screenCoord;
      
      uniform vec2 u_screenSize;
      
      void main() {
        v_texCoord = a_coords * 0.5 + 0.5;
        v_screenCoord = v_texCoord * u_screenSize;
        gl_Position = vec4(a_coords, 0.0, 1.0);
      }
      `,
      // This should paint all fragments green (values are RGB + Alpha)
      fragmentShader: `
      void main() {
        gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
      }
      `
    })
  }
};


// An array to contain all of the features from the dataset after processing
const featuresArr = [];

// Fetch data, convert to JSON, then processData()
fetch("data/weather.json")
  .then(function (resData) {
    return resData.json();
  })
  .then(function (resDataJSON) {
    processData(resDataJSON);

    // Initialize the map
    const map = new Map({
      layers: [
        new Tile({ source: new OSM() }),
        // new WebGLPointsLayer({
        new CustomWebGLPointsLayer({
          source: new VectorSource({ features: featuresArr }),
          style: {
            symbol: {
              symbolType: "triangle",
              size: 6,
              color: "red",
              rotation: ["*", ["get", "deg"], Math.PI / 180],
              rotateWithView: true,
            },
          },
        }),
      ],
      target: "map",
      view: new View({center: [0, 0],zoom: 0,}),
    });
  });
function processData(data) {
  const weatherData = data.list;
  // Process data
  for (let i = 0; i < weatherData.length; ++i) {
    // Extract coordinates & wind values
    const { size, coord, wind } = weatherData[i];

    // Convert from lon/lat to floats using the provided OL method
    // const coordinates = fromLonLat([coord.lon, coord.lat]);
    const coordinates = [coord.xPos, coord.yPos];

    // Create this feature & add wind properties
    const feature = new Feature(new Point(coordinates));
    feature.setProperties(coordinates);
    feature.setProperties(wind);

    // Push feature to the array
    featuresArr[i] = feature;
  }
}
