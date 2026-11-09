// Runs before every Jest test file (CRA convention).
import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// react-router v7 needs these; CRA's jsdom (Jest 27) doesn't provide them.
if (!global.TextEncoder) global.TextEncoder = TextEncoder;
if (!global.TextDecoder) global.TextDecoder = TextDecoder;
