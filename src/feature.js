import { useEffect } from 'react';

export const setup = (callback) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(callback, []);
}
