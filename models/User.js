const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        name:{
            type: String,
            required: true,
            trim: true,
        },
        email:{
            type: String,
            required: true,
            trim: true,
            match: [/.+\@.+\..+/, "Please enter a valid email address"],

        },
        password: {
            type: String,
            required: true,
            minLength: 6,
        },
        role: {
            type: String,
            enum: ["customer", "admin"],
            default: "customer",
        },
    },
    {timestamps: true}
)

// Password hashing - Mongoose 9 compatible async hook
userSchema.pre("save", async function (){
    // Skip if password hasn't been modified
    if(!this.isModified("password")) {
        return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match User entered pasword to hashed password
userSchema.methods.matchPassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);
}
module.exports = mongoose.model("User", userSchema);