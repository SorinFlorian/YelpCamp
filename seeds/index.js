const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground');

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';

main().catch(err => console.log('Database ERROR', err));
async function main() {
  await mongoose.connect(dbUrl);
  console.log('Database connected!');
}

const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
  await Campground.deleteMany({});
  for (let i = 0; i < 500; i++) {
    const random1000 = Math.floor(Math.random() * 1000);
    const price = Math.floor(Math.random() * 20) + 10;
    const camp = new Campground({
      author: '62b48b1264aa095cf5e63f4a',
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      title: `${sample(descriptors)} ${sample(places)}`,
      description:
        'Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptas ut veniam animi esse ipsa enim dolorum quaerat possimus corrupti. Impedit veritatis non quasi magni ipsam, quis dolorem atque quaerat debitis?',
      price,
      geometry: {
        type: 'Point',
        coordinates: [
          cities[random1000].longitude,
          cities[random1000].latitude,
        ],
      },
      images: [
        {
          url: 'https://res.cloudinary.com/dgw9x33wv/image/upload/v1655844453/YelpCamp/ttrtlq3hviuyklmf883y.jpg',
          filename: 'YelpCamp/ttrtlq3hviuyklmf883y',
        },

        {
          url: 'https://res.cloudinary.com/dgw9x33wv/image/upload/v1655844452/YelpCamp/zwhzney0ecevcgbqzjy7.jpg',
          filename: 'YelpCamp/zwhzney0ecevcgbqzjy7',
        },
        {
          url: 'https://res.cloudinary.com/dgw9x33wv/image/upload/v1655844451/YelpCamp/socf7tuutx5vj2gsz0yd.jpg',
          filename: 'YelpCamp/socf7tuutx5vj2gsz0yd',
        },
      ],
    });
    await camp.save();
  }
};
seedDB().then(() => {
  mongoose.connection.close();
});
