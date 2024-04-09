import { configureStore } from '@reduxjs/toolkit'
import appReducer from './reduxfeat/appslice.js';

export default configureStore({
    reducer: {
        app: appReducer
    }
});