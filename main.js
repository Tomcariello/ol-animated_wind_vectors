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

function processData(sampleWindData) {
  for (let i = 0; i < sampleWindData.length; ++i) {
    const { coord, wind } = sampleWindData[i];
    const coordinates = fromLonLat([coord.xPos, coord.yPos]);
    const feature = new Feature(new Point(coordinates));
    
    // This sets "speed" & "degree" on the feature
    feature.setProperties({'speed': wind.speed});
    feature.setProperties({'featureColorRed': Math.random()});
    feature.setProperties({'featureColorGreen': Math.random()});
    feature.setProperties({'featureColorBlue': Math.random()});
    featuresArr[i] = feature;
   }
}

// A custom renderer intended to draw GLSL output to a layer
class CustomWebGLPointsLayer extends WebGLPointsLayer {
  createRenderer() {
    return new WebGLPointsLayerRenderer(this, { 
      attributes: [
        {
          name: 'Xcoord',
          callback: function(feature) {
            return 0.25;
          }
        },
        {
          name: 'Ycoord',
          callback: function(feature) {
            return 0.75;
          }
        },
        {
          name: 'featureColorRed',
          callback: function(feature) {
            return feature.values_.featureColorRed;
          }
        },
        {
          name: 'featureColorGreen',
          callback: function(feature) {
            return feature.values_.featureColorGreen;
          }
        },
        {
          name: 'featureColorBlue',
          callback: function(feature) {
            return  feature.values_.featureColorBlue;
          }
        },
      ],

      // You can see these shaders being processed in /ol/webgl/Helper.js line ~827
      vertexShader: 
      `
        attribute vec2 a_coordinates;
        attribute float a_featureColorRed;
        attribute float a_featureColorGreen;
        attribute float a_featureColorBlue;
        
        varying vec4 v_featureColor;

        void main() {
          v_featureColor = vec4(a_featureColorRed, a_featureColorGreen, a_featureColorBlue, 0.5);
          gl_Position = vec4(a_coordinates, 0.0, 1.0);
        }
      `,
      fragmentShader: 
      `
        precision mediump float;
        varying vec4 v_featureColor;

        void main() {
          gl_FragColor = v_featureColor;
        }
      `
    })
  }
};


const customGLSLLayer = new CustomWebGLPointsLayer({
  source: new VectorSource({ features: featuresArr }),
  style: {
    symbol: {
      symbolType: "square",
    },
  },
  zIndex: 10,
});

const map = new Map({
  layers: [
    new Tile({ 
      source: new OSM(), 
      zIndex: 1, 
    }),
    customGLSLLayer
  ],
  target: "map",
  view: new View({center: [0, 0],zoom: 0,}),
});
 