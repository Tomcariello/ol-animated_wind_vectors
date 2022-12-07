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
import { data as sampleWindData } from './data/sampleWindData.js' ;

// An array of features. Populated after processing our sampleWindData
const featuresArr = [];
processData(sampleWindData);

function processData(weatherData) {
  for (let i = 0; i < weatherData.length; ++i) {
    const { coord, wind } = weatherData[i];
    const coordinates = fromLonLat([coord.xPos, coord.yPos]);
    const feature = new Feature(new Point(coordinates)); // This must be set for the blue/yellow layers to render
    // feature.setProperties(coordinates); // This is NOT required for rendering
    
    // This sets "speed" & "degree" on the feature
    feature.setProperties({'speed': wind.speed});
    feature.setProperties({'featureColor': '1.0'});
    featuresArr[i] = feature;
   }
  //  console.log(featuresArr);
}

// A custom renderer intended to draw GLSL output to a layer
class CustomWebGLPointsLayer extends WebGLPointsLayer {
  createRenderer() {
    return new WebGLPointsLayerRenderer(this, { 
      attributes: [
        {
          name: 'vec2 a_coords',
          callback: function(feature) {
            return [ 
              feature.values_[0],
              feature.values_[1],
            ];
          }
        },
        {
          name: 'vec4 a_color',
          callback: function(feature) {
            // Always return red for now
            return [0.0, 1.0, 0.0, 0.5];
          }
        },
      ],
      vertexShader: 
      `
      attribute vec2 a_coordinates;
      attribute float a_featureColor;
      varying vec4 v_featureColor;

      void main() {
        v_featureColor = vec4(a_featureColor, 0.0, 0.0, 1.0);
        gl_Position = vec4(a_coordinates, 0.0, 1.0);
      }`,
      // This should paint all fragments the value of v_featureColor
      fragmentShader: `
      precision mediump float;

      // Declare varyings; these values have been passed along from the vertexShader
      varying vec4 v_featureColor;

      void main() {
        gl_FragColor = v_featureColor;
      }
      `
    })
  }
};

// Create various layers to include on map
const blueTriangleLayer = new WebGLPointsLayer({ 
  source: new VectorSource({ features: featuresArr }),
  style: {
    symbol: {
      symbolType: "triangle",
      size: 24,
      color: "blue",
      rotation: ["*", ["get", "degree"], Math.PI / 180],
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
      // declaring style expressions initializes the variable into GLSL
      // color: ["get", "featureColor"],
      // size: ["get", "degree"],
      // fill:  ["get", "coordinates"],
      symbolType: "square",
      // size: 4,
      color: "red",
    },
    // How is this supposed to work???
    renderer: function (frameState) {
      // new CustomWebGLPointsLayer();
    }
  },
  zIndex: 10,
  Options: {
    attributes: {
      name: 'featureColor',
      callback: function(feature) {
        return 1.0;
      }
    },
  },
});

// With EITHER blueTriangleLayer OR yellowCircleLayer active customGLSLLayer does NOT render
// With BOTH blueTriangleLayer AND yellowCircleLayer inactive customGLSLLayer DOES render
const map = new Map({
  layers: [
    new Tile({ 
      source: new OSM(), 
      zIndex: 1, 
    }),
    blueTriangleLayer,
    yellowCircleLayer,
  ],
  target: "map",
  view: new View({center: [0, 0],zoom: 0,}),
});
map.addLayer(customGLSLLayer);

// console.log(map.getLayers());
 