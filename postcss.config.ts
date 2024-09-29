/** @type {import("postcss-load-config").Config} */

import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default {
	plugins: [tailwindcss, autoprefixer],
}
