import Feature from "ol/Feature";
import Map from "ol/Map";
import Point from "ol/geom/Point";
import VectorSource from "ol/source/Vector";
import Tile from "ol/layer/Tile";
import View from "ol/View";
import OSM from "ol/source/OSM";
import WebGLPointsLayer from "ol/layer/WebGLPoints";
import WebGLPointsLayerRenderer from 'ol/renderer/webgl/PointsLayer';
import WebGLVectorLayerRenderer from 'ol/renderer/webgl/VectorLayer';
import {fromLonLat} from 'ol/proj';

const sampleWindData = {
  "list": [
    {
      "coord": { "xPos": -8.711, "yPos": 30.35 },
      "wind": { "speed": 59.58, "deg": 8 }
    },
    {
      "coord": { "xPos": 4, "yPos": -10.237 },
      "wind": { "speed": 42.4, "deg": 50 }
    },
    {
      "coord": { "xPos": 24.236, "yPos": 20.263 },
      "wind": { "speed": 38.17, "deg": 316 }
    },
    {
      "coord": { "xPos": 4.531, "yPos": 40.392 },
      "wind": { "speed": 52.51, "deg": 91 }
    },
    {
      "coord": { "xPos": -6.499, "yPos": 5 },
      "wind": { "speed": 55.52, "deg": 192 }
    }
  ]
}

// A custom renderer intended to draw GLSL output to a layer
class CustomWebGLPointsLayer extends WebGLPointsLayer {
  createRenderer() {
    return new WebGLPointsLayerRenderer(this, { 
      // "attributes" are passed into the shaders
      attributes: [
        {
          name: 'a_coords',
          callback: function(feature) {
            // Array of XY positions per feature to pass to the vertexShader.
            return [ 
              feature.values_[0],
              feature.values_[1],
            ];
          }
        },
        {
          name: 'a_color',
          callback: function(feature) {
            // Always return red for now
            return [1.0, 0.0, 0.0, 0.5];
          }
        }
      ],
      vertexShader: 
      `
      // Specify the precision level to use with floats in this shader.
      precision mediump float;

      // Declare attributes; these values are passed into GLSL from JavaScript
      attribute vec2 a_coords;
      attribute vec4 a_color; // <-- This value appears undefined..?

      // Declare varyings; these values will be passed along to the fragmentShader
      varying vec4 v_color;

      // Creating a vertex variable (set to BLACK)
      vec4 color_declared_in_vertex = vec4(0.0,0.0,0.0,1.0);

      void main() {
        // Setting the color based on this condition
        if (a_coords[0] > 0.5) {
          color_declared_in_vertex = vec4(1.0,0.0,0.0,0.5); // Red
        } else if (a_coords[0] < 0.0) {
          color_declared_in_vertex = vec4(0.0,0.0,1.0,0.5); // Blue
        } else {
          color_declared_in_vertex = vec4(0.75, 0.75, 0.75, 1.0); // Gray
        }

        // v_color = vec4(a_color); // set the value of v_color to the attribute color
        v_color = vec4(color_declared_in_vertex); // set the value of v_color to a local variable value
        
        gl_Position = vec4(a_coords, 0.0, 1.0); // Set the position
      }
      `,
      // This should paint all fragments the value of v_color
      fragmentShader: `
      precision mediump float;

      // Declare varyings; these values have been passed along from the vertexShader
      varying vec4 v_color;

      void main() {
        // Set the color using the varying var v_color DOESN'T WORK
        gl_FragColor = vec4(v_color); 
      }
      `
    })
  }
};

// This is a direct extension of WebGLPointsLayer & behaves properly.
class CopyWebGLPointsLayer extends WebGLPointsLayer {};

// An array of features. Populated after processing our sampleWindData
const featuresArr = [];
processData(sampleWindData);

function processData(data) {
  const weatherData = data.list;
  for (let i = 0; i < weatherData.length; ++i) {
    const { coord, wind } = weatherData[i];
    const coordinates = fromLonLat([coord.xPos, coord.yPos]);
    const feature = new Feature(new Point(coordinates));
    feature.setProperties(coordinates);
    feature.setProperties(wind);
    featuresArr[i] = feature;
   }
}

const OSMLayer = new Tile({ 
  source: new OSM(), 
  zIndex: 1, 
});

const blueTriangleLayer = new WebGLPointsLayer({ 
  source: new VectorSource({ features: featuresArr }),
  style: {
    symbol: {
      symbolType: "triangle",
      size: 24,
      color: "blue",
      rotation: ["*", ["get", "deg"], Math.PI / 180],
    },
  },
  zIndex: 2,
});

const yellowCircleLayer = new WebGLPointsLayer({
  source: new VectorSource({ features: featuresArr }),
  style: {
    symbol: {
      symbolType: "circle",
      size: 10,
      color: "yellow",
    },
  },
  zIndex: 3,
});


// With a WebGLPointsLayer black squares are rendered **regardless** of other layers settings.
// const customGLSLLayer = new WebGLPointsLayer({

// Black squares are also rendered correctly with a Layer extension that is unmodified
// const customGLSLLayer = new CopyWebGLPointsLayer({

// But with the CustomWebGLPointsLayer (which calls createRenderer() & sets GLSL properties)
// output only renders if BOTH blueTriangleLayer AND yellowCircleLayer are **disabled**.
const customGLSLLayer = new CustomWebGLPointsLayer({
  source: new VectorSource({ features: featuresArr }),
  style: {
    symbol: {
      symbolType: "square",
      size: 4,
      color: "black"
    },
  },
  zIndex: 10,
});


// With EITHER blueTriangleLayer OR yellowCircleLayer active customGLSLLayer does NOT render
// With BOTH blueTriangleLayer AND yellowCircleLayer inactive customGLSLLayer DOES render
const map = new Map({
  layers: [
    OSMLayer,
    blueTriangleLayer,
    yellowCircleLayer,
    customGLSLLayer,
  ],
  target: "map",
  view: new View({center: [0, 0],zoom: 0,}),
});

// Logging shows the customGLSLLayer added in the array_ with the appropriate zIndex but 
// it is not visible on the screen
console.log(map.getLayers());
 