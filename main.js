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
      attributes: [
        {
          name: 'coordinates',
          callback: function(feature) {
            return Math.floor(Math.random() * 100);
          }
        },
      ],
      // This crashes if the vertexShader or fragmentShader fail to compile
      // But nothing is drawn to the screen regardless of the values below.
      vertexShader: `
        attribute vec4 a_position;
        
        void main() {
          gl_Position = a_position;
        }`,
      fragmentShader: `
        precision mediump float;
        
        void main() {
          gl_FragColor = vec4(1, 0.5, 0.75, 0.5);
        }`
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
    const coordinates = fromLonLat([coord.lon, coord.lat]);

    // Create this feature & add wind properties
    const feature = new Feature(new Point(coordinates));
    feature.setProperties(coordinates);
    feature.setProperties(wind);

    // Push feature to the array
    featuresArr[i] = feature;
  }
}
