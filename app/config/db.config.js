module.exports = {
    HOST: "localhost",
    PORT: 27017,
    DB: "caloriesinput_db",
    DBTYPE: "cloud",
    LOCAL_URI: `mongodb://${this.HOST}:${this.PORT}/${this.DB}`,
    CLOUD_URI: `mongodb+srv://admin:1234567890@cluster0.qblpb.mongodb.net/test`
  };