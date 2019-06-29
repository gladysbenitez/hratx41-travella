// const createError = require('http-errors');
// const logger = require('morgan');
// const  {connect, User, NightLife, Restaurant, DayTrip, ThingsToDo} = require('./db/index.js')
const express = require('express');
const app = express();
app.use(express.static('../client/public'));
require("dotenv").config({ path: "../.env" });
const fetch = require("node-fetch");
var faker = require("faker");
// var db = require("./db/index");
const api = process.env.API_KEY;
// var fs = require("fs")


app.get("/location", (req, res) => {
  //console.log(req.query);
  let location = req.query.city;
  let topSpots, thingsToDo, restaurants, nightLife, dayTrips;

 let prom1 = fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=night+life+in+${location}&key=${api}`
  )
    .then(res => res.json())
    .then(async data => {
      nightLife = await getDetails(data.results);
    })

   
    let prom2 =  fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=outdoor+activities+in+${location}&key=${api}`
      )
        .then(res => res.json())
        .then(async data => {
          thingsToDo = await getDetails(data.results);
        })

        
       let prom3 = fetch(
            `https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurants+in+${location}&key=${api}`
          )
            .then(res => res.json())

            .then(async data => {
              restaurants = await getDetails(data.results);
            })
           
           let prom4 = fetch(
                `https://maps.googleapis.com/maps/api/place/textsearch/json?query=day+trips+in+${location}&key=${api}`
              )
                .then(res => res.json())
                .then(async data => {
                  dayTrips = await getDetails(data.results);
                })
                Promise.all([prom1,prom2,prom3,prom4])
                .then(() => {
                  let locationData = {};
                  locationData["nightLife"] = parseData(nightLife);
                  locationData["restaurants"] = parseData(restaurants);
                  locationData["thingsToDo"] = parseData(thingsToDo);
                  locationData["dayTrips"] = parseData(dayTrips);

                  //res.send(locationData);
                  return locationData;
                })
                .then(locationData => {
                  let nightLife = locationData.nightLife;
                  let dayTrips = locationData.dayTrips;
                  let restaurants = locationData.restaurants;
                  let thingsToDo = locationData.thingsToDo;
                  // addPhotos(nightLife, dayTrips, restaurants, thingsToDo);
                  let topSpots = topPlaces(
                    nightLife,
                    dayTrips,
                    restaurants,
                    thingsToDo
                  );

                  locationData.topSpots = topSpots;

                  // let string = JSON.stringify(locationData);
                  // fs.writeFile("thing.json", string, function(err, result) {
                  //   if (err) console.log("error", err);
                  // });
                  // console.log("sending to app");
                  res.send(locationData);
                })
              
    
    .catch(err => console.log(err));
});

let parseData = array => {
  let results = [];
  let long,
    lat,
    name,
    photo,
    rating,
    totalReviews,
    address,
    place_id,
    openOrNot,
    websiteUrl,
    hoursOfOperation,
    phoneNumber,
    icon;
  //console.log("this is array inside parseData", array);
  for (let i = 0; i < array.length; i++) {
    let paragraph = faker.lorem.paragraph();
    let uuid = i;

    lat = array[i].geometry.location.lat;
    long = array[i].geometry.location.lat;
    name = array[i].name;
    address = array[i].formatted_address;
    place_id = array[i].place_id;
    rating = array[i].rating;
    totalReviews = array[i].user_ratings_total;
    photo = array[i].photos;
    openOrNot = array[i].openOrNot;
    websiteUrl = array[i].websiteUrl;
    phoneNumber = array[i].phoneNumber;
    priceLevel = array[i].priceLevel;
    formattedAddress = array[i].formatted_address;
    hoursOfOperation = array[i].hoursOfOperation;
    icon = array[i].icon;

    //photo = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photoreference=${photoRef}&key=${api}`;
    results.push({
      uuid: uuid,
      name: name,
      address: address,
      long: long,
      lat: lat,
      photos: photo,
      rating: rating,
      totalReviews: totalReviews,
      place_id: place_id,
      description: paragraph,
      openOrNot: openOrNot,
      websiteUrl: websiteUrl,
      hoursOfOperation: hoursOfOperation,
      priceLevel: priceLevel,
      phoneNumber: phoneNumber,
      icon: icon
    });
  }

  return results;
};

let topPlaces = (arr1, arr2, arr3, arr4) => {
  arr1.sort((a, b) => a.rating - b.rating);
  let newArr1 = arr1.slice(-5);

  arr2.sort((a, b) => a.rating - b.rating);
  let newArr2 = arr2.slice(-5);
  arr3.sort((a, b) => a.rating - b.rating);
  let newArr3 = arr3.slice(-5);
  arr4.sort((a, b) => a.rating - b.rating);
  let newArr4 = arr4.slice(-6);

  let result = newArr1.concat(newArr2, newArr3, newArr4);

  return result;
};

let getDetails = async array => {
  for (let i = 0; i < array.length; i++) {
    let x = array[i];
    await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?placeid=${
        x.place_id
      }&fields=name,formatted_phone_number,website,opening_hours,price_level,photos,types&key=${api}`
    )
      .then(res => res.json())
      .then(data => {
        // console.log("im inside get DEtails", data.result.types);
        const result = data.result;

        let photoData = result.photos;
        let openNowData = result.opening_hours.open_now;
        let operatingData = result.opening_hours.weekday_text;
        let priceData = result.price_level;
        let typeData = result.types;
        let website = result.website;
        let phoneNumber = result.formatted_phone_number;

        //console.log("does this exits?", photoData);
        let photos = [];
        photoData.map(x => {
          photos.push(
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photoreference=${
              x.photo_reference
            }&key=${api}`
          );
        });
        x.photos = photos;
        x.hoursOfOperation = operatingData;
        x.openOrNot = openNowData;
        x.priceLevel = priceData;
        x.type = typeData;
        x.websiteUrl = website;
        x.phoneNumber = phoneNumber;
        // console.log(x);
      })
      .catch(err => console.log(err));
    //console.log(array[0]);
  }
  //console.log(array[0]);
  return array;
};


var port = process.env.PORT || 8000;
app.listen(port, ()=>{console.log(`listening at ${port}`)})


module.exports = app;