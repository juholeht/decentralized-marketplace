import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import {marketStore} from './store/model';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(
<Provider store={marketStore}>
    <BrowserRouter>
        <App/>
    </BrowserRouter>
</Provider>, 
document.getElementById('root'));
registerServiceWorker();
