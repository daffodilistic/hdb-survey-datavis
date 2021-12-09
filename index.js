import ServerProxy from './server.mjs';
const DateTime = luxon.DateTime;

const vueApp = {
  compilerOptions: {
    delimiters: ['${', '}']
  },
  data() {
    return {
      loaded: false,
      dateRange: [],
      surveyData: null,
      selectedDateIndex: 0,
      map: null,
    }
  },
  mounted() {
    this.getDateRange();
    this.initMap();
  },
  methods: {
    initMap() {
      this.map = new maplibregl.Map({
        container: 'map',
        style: 'https://api.maptiler.com/maps/basic/style.json?key=Slp3lGHS5T2rTidocvUZ', // stylesheet location
        center: [103.8198, 1.3521], // starting position [lng, lat]
        zoom: 11 // starting zoom
      });
      this.map.addControl(new maplibregl.NavigationControl());
      // When a click event occurs on a feature in the blocks layer, open a popup at the
      // location of the click, with description HTML from its properties.
      this.map.on('click', 'blocks-layer', (e) => {
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(this.renderSupportHtml(JSON.parse(e.features[0].properties.survey_data)))
          .addTo(this.map);
      });
      // Change the cursor to a pointer when the mouse is over the blocks layer.
      this.map.on('mouseenter', 'blocks-layer', () => {
        this.map.getCanvas().style.cursor = 'pointer';
      });

      // Change it back to a pointer when it leaves.
      this.map.on('mouseleave', 'blocks-layer', () => {
        this.map.getCanvas().style.cursor = '';
      });
    },
    updateMap() {
      if (this.map.isSourceLoaded('blocks')) {
        this.map.removeLayer('blocks-layer');
        this.map.removeSource('blocks');
      }

      // Add a source for the block polygons.
      this.map.addSource('blocks', {
        'type': 'geojson',
        'data': this.surveyData
      });
      this.map.addLayer({
        'id': 'blocks-layer',
        'type': 'fill',
        'source': 'blocks',
        'paint': {
          'fill-color': 'rgba(200, 100, 240, 0.4)',
          'fill-outline-color': 'rgba(200, 100, 240, 1)'
        }
      });

      // Auto-fit map to available data
      const bbox = turf.bbox(this.surveyData);
      // console.log(bbox);
      this.map.fitBounds(bbox, { duration: 5000, maxZoom: 16 });
    },
    displayDate() {
      return DateTime.fromISO(this.dateRange[this.selectedDateIndex])?.toFormat('dd LLL yyyy');
    },
    getDateRange() {
      this.dateRange = [];
      ServerProxy.getDates().then(response => {
        console.log("Dates loaded");
        this.dateRange = response.data;
        this.selectedDateIndex = this.dateRange.length - 1;
        this.loaded = true;
      });
    },
    loadSurveyData() {
      this.loaded = false;
      ServerProxy.getSurveys(this.dateRange[this.selectedDateIndex]).then(response => {
        console.log("Loaded survey data");
        this.surveyData = response.data;
        this.updateMap();
        this.loaded = true;
      });
    },
    renderSupportHtml(surveyData) {
      console.log("Data is " + JSON.stringify(surveyData));
      if (surveyData.app_quality) {
        const lastSurveyedDate = luxon.DateTime.fromISO(surveyData.updated_at).toLocaleString(luxon.DateTime.DATETIME_FULL);
        return `
        <h5 class="fw-bold">Support</h5>
        <h5><span class="badge bg-danger">${Number(surveyData.app_quality.poor / surveyData.response_count * 100).toFixed(2)}%</span><h5>
        <h5><span class="badge bg-warning">${Number(surveyData.app_quality.average / surveyData.response_count * 100).toFixed(2)}%</span><h5>
        <h5><span class="badge bg-success">${Number(surveyData.app_quality.good / surveyData.response_count * 100).toFixed(2)}%</span><h5>
        <h5><span class="badge bg-secondary">${Number(surveyData.app_quality.none / surveyData.response_count * 100).toFixed(2)}%</span><h5>
        <p><h6 class="fw-bold">Count:</h6>${surveyData.response_count}</p>
        <p><h6 class="fw-bold">Last Surveyed:</h6>${lastSurveyedDate}</p>
      `;
      } else {
        return `<h6>No data available</h6>`;
      }
    }
  }
};

Vue.createApp(vueApp).mount('#vueApp');