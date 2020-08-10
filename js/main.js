// Har kommenterat lite blandat på svenska och engelska. Engelska är för "kunden", medan
// svenska är mer meta-kommentarer för er som rättar.

const DJUPVIKS_HAMN_LOCATION = { latitude: 57.3081, longitude: 18.1489 };

// `main` is called at the bottom of this file.
const main = () => {
    fetchSmhiWeatherData(DJUPVIKS_HAMN_LOCATION)
        .then(forecastComingHours)
        .then(populateForecastTable);
}

// Fetches weather data from SMHI's JSON API, returning a Promise of the weather data for
// the given location as a javascript object.
const fetchSmhiWeatherData = ({ longitude, latitude }) => {
    const queryUrl =
          "https://opendata-download-metfcst.smhi.se"
          + "/api/category/pmp3g/version/2/geotype/point"
          + "/lon/" + longitude
          + "/lat/" + latitude
          + "/data.json";
    return fetch(queryUrl).then(resp => resp.json());
};

// Show the forecast for at most this many hours into the future.
const N_FORECAST_HOURS = 6;

// Given a SMHI weather forecast object, extract the forecasted temperatures for the
// coming hours as an Array.
const forecastComingHours = rawForecast => {
    const parseValidTime = point => ({ ...point, validTime: new Date(point.validTime)  });
    // Clarification: points like data points, not geographical points.
    const points = rawForecast.timeSeries.map(parseValidTime);
    // Läste först fel i APIet och trodde den kunde ge punkter med validTime innan tiden
    // man skickade requestet vid, men det var bara nåt jag läste fel med UTC vs. lokal
    // tidszon. Behåller dock den här koden för att sålla ut förflutna datapunkter, för
    // säkerhets skull.
    const now = new Date();
    const past = point => point.validTime < now;
    // According to http://opendata.smhi.se/apidocs/metfcst/parameters.html, the "t"
    // parameter of a point in the timeSeries data is the air temperature in celsius.
    const getTemperature = point => point.parameters.find(p => p.name === "t").values[0];
    return take(N_FORECAST_HOURS, skipWhile(past, points))
        .map(point => ({ time: point.validTime,
                         temperature: getTemperature(point) }));
};

const populateForecastTable = forecast => {
    document.querySelector("#weather tbody").innerHTML = forecastHtml(forecast);
};

const forecastHtml = forecast => forecast.map(forecastPointHtml).join("\n");
const forecastPointHtml = ({ time, temperature }) =>
      "<tr><td>" + timeString(time) + "</td><td>" + temperature + "°C</td></tr>";
const timeString = time =>
      time.toLocaleTimeString("sv-SE", {hour: 'numeric', minute: 'numeric'})

// A kind of filter that skips over elements of the array until the condition is
// satisfied, keeping the rest.
//
// Finns säkert mer objektorienterade sätt att göra vad `skipWhile` och `take` gör, men
// jag har i stort sett bara använt Haskell tidigare, så jag kör på mer funktionell stil
// såhär som jag är bekväm med.
const skipWhile = (condition, array) => array.slice(array.findIndex(x => !condition(x)));

// Take the first `n` values of the array, discarding the rest.
const take = (n, array) => array.slice(0, n);

main();
