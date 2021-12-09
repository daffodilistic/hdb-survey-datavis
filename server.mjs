export default Object.freeze({
  async getDates() {
    return axios.get('data/dates.json');
  },
  async getSurveys(surveyDate) {
    const response = await axios.get(`data/surveys/${surveyDate}.json`);

    response.data.features.forEach(element => {
      const response_app_quality = {
        good: Math.ceil(Math.random() * 50),
        average: Math.ceil(Math.random() * 50),
        poor: Math.ceil(Math.random() * 50),
        none: Math.ceil(Math.random() * 50)
      };
      const response_count = Object.values(response_app_quality).reduce((acc, curr) => acc + curr);

      element.properties = {
        survey_data: {
          app_quality: response_app_quality,
          updated_at: `${surveyDate}T00:00:00Z`,
          response_count: response_count
        }
      };
    });

    console.log("response.data", response.data);
    return response;
  }
});