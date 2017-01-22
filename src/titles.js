
var titles = {};
var country = 'america';

function updateCountry() {

  if (!titles[country]) {
    getData();
  } else {
    selectAnother();
  }
}

function getData() {
  var filename = 'data/titles/' + country + '_titles.json';
  d3.json(filename, addData)

}

function addData(d) {
  titles[country] = d;
  selectAnother();
}

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function selectAnother() {
  var len = titles[country].length;
  var index = randomIntFromInterval(0, len);
  var newTitle = titles[country][index];
  d3.select('#old').text(newTitle.old);
  d3.select('#new').text(newTitle.new);
}

d3.select('#titleSelect').on('change', function () {
  country = d3.select(this).node().value;
  updateCountry();
  console.log(country);
});

d3.select('#another').on('click', selectAnother);

getData();
