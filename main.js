import Feature from "ol/Feature";
import Map from "ol/Map";
import Point from "ol/geom/Point";
import VectorSource from "ol/source/Vector";
import Tile from "ol/layer/Tile";
import View from "ol/View";
import OSM from "ol/source/OSM";
import WebGLPointsLayer from "ol/layer/WebGLPoints";
import WebGLPointsLayerRenderer from 'ol/renderer/webgl/PointsLayer';
import {fromLonLat} from 'ol/proj';

class CustomWebGLPointsLayer extends WebGLPointsLayer {
  createRenderer() {
    return new WebGLPointsLayerRenderer(this, { 
      // "attributes" are passed into the shaders
      attributes: [
        {
          name: 'a_coords',
          callback: function(feature) {
            // Array of XY positions per feature to pass to the vertexShader.
            const coordinatesArr = [ 
              feature.values_[0],
              feature.values_[1],
            ];
            console.log(coordinatesArr);
            return coordinatesArr;
          }
        },
        {
          name: 'a_color',
          callback: function(feature) {
            // Create an array of some colors & select one at random
            const colorsArr = {
              "red":   `[1.0, 0.0, 0.0]`,
              "green": `[0.0, 1.0, 0.0]`,
              "blue":  `[0.0, 0.0, 1.0]`,
            };

            const obj = Object.keys(colorsArr);
            const randomColor = obj[Math.floor(Math.random() * obj.length)];
            const vec3_color = colorsArr[randomColor];

            return vec3_color;
          }
        }
      ],
      vertexShader: 
      `
      // Specify the precision level to use with floats in this shader.
      precision mediump float;

      // Declare attributes; these values are passed into GLSL from JavaScript
      attribute vec2 a_coords;
      attribute vec3 a_color;

      // Declare varyings; these values will be passed along to the fragmentShader
      varying vec3 v_color;

      void main() {
        v_color = vec3(a_color); // set the value of v_color <-- This doesn't work?
        gl_Position = vec4(a_coords, 0.0, 1.0); // Set the position
      }
      `,
      // This should paint all fragments the value of v_color
      fragmentShader: `
      precision mediump float;

      // Declare varyings; these values have been passed along from the vertexShader
      varying vec3 v_color;

      void main() {
        gl_FragColor = vec4(v_color, 0.5); // Set the color dynamically - DOESN'T WORK
        // gl_FragColor = vec4(1.0, 0.0, 1.0, 0.5); // pink; WORKS!
        // gl_FragColor = vec4(1, 0, 0, 0.5); // red; WORKS! (testing ints, not floats)
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
        // new WebGLPointsLayer({ // Use this if you want to see the points rendered statically
        new CustomWebGLPointsLayer({
          source: new VectorSource({ features: featuresArr }),
          style: {
            symbol: {
              symbolType: "triangle",
              size: 16,
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
    const coordinates = fromLonLat([coord.xPos, coord.yPos]);

    // This is a hack to get me values in the 0 to 1 range
    const glslCoordinates = [coord.xPos % 1, coord.yPos % 1];

    const feature = new Feature(new Point(coordinates));
    feature.setProperties(coordinates);
    feature.setProperties(glslCoordinates);
    feature.setProperties(wind);

    featuresArr[i] = feature;
  }
  console.log(featuresArr);
}
