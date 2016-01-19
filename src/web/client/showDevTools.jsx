import React from 'react'; // eslint-disable-line no-unused-vars
import { render } from 'react-dom';
import DevTools from './components/DevTools';

export default function showDevTools(store) {
    const popup = window.open(null, 'Redux DevTools', 'menubar=no,location=no,resizable=yes,scrollbars=no,status=no');
    if(!popup) {
        console.log('showDevTools could not open popup!'); // eslint-disable-line
        return;
    }
    // Reload in case it already exists
    popup.location.reload();

    setTimeout(() => {
        popup.document.write('<div id="react-devtools-root"></div>');
        render(
            <DevTools store={store}/>,
            popup.document.getElementById('react-devtools-root')
        );
    }, 10);
}
