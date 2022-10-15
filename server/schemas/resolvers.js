const { User } = require('../models')
const { signToken } = require('../utils/auth')
const { AuthenticationError } = require('apollo-server-express');

const resolvers = {
    Query: {
        //testing purposes users
        users: async() => {
            return User.find()
            .populate('savedBooks');  
        },
        me: async(parent, args, context) => {
            if (context.user){
                const userData = await User.findOne({_id: context.user._id})
                .select('-__v -password')
                .populate('savedBooks'); 

                return userData
            }
            throw new AuthenticationError("not logged in")
        }
    },
    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
            return {user, token};
        },
        login: async (parent, {email, password}) => {
            const user = await User.findOne({email});

            if (!user){
                throw new AuthenticationError('Incorrect Credentials')
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw){
                throw new AuthenticationError('Incorrect Credentials')
            }

            const token = signToken(user);
            return {user, token};
        },
        saveBook: async (parent, args, context ) => {
            if (context.user){
                const data = await User.findByIdAndUpdate(
                    {_id: context.user._id},
                    {$addToSet: {savedBooks: args.content}},
                    {new: true, runValidators: true}
                )
                return data;
            }
            throw new AuthenticationError("you need to be logged in!")
        },
        removeBook: async (parent, {bookId}, context) => {
            if (context.user){
                const data = await User.findByIdAndUpdate(
                    {_id: context.user._id},
                    { $pull: { savedBooks: { bookId: bookId } } },
                    { new: true }
                )
                return data;
            }
            throw new AuthenticationError("you need to be logged in!")
        }
    }
}


module.exports = resolvers;