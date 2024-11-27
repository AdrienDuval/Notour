const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');

dotenv.config({ path: './config.env' });
const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD,
);

// console.log(DB);
mongoose.connect(DB).then(() => {
    console.log('DB connection succesfull');
});

// READ JSON FILE.

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'));

const importData = async () => {
    try {
        await Tour.create(tours);
        console.log('data successfully loaded!')
    } catch (err) {
        console.log(err);
    }
    process.exit();
};

// DELETE all DATA from COLLECTION
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        console.log('data successfully Deleted!')
    } catch (err) {
        console.log(err);
    }
    process.exit();
}

if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();
}

console.log(process.argv);