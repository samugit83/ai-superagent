'use client';

import { Provider } from 'react-redux';
import store from './store';
import { useStore } from 'react-redux'


export function ReduxProvider({ children }) {
  return (
    <Provider store={store}>
        {children}
    </Provider>
  );
}

export {useStore}
