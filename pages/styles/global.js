import { createGlobalStyle, ThemeProvider } from 'styled-components';

export default createGlobalStyle`
  * {
    box-sizing: border-box;
    font-size: 100%;
    }
  
  html {
    line-height: 1.15;
    -webkit-text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
    font-family: Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
  }
  
  *, :after, :before {
    box-sizing: inherit;
  }
  
  div#__next
    {
      min-height: 100%;
      min-width: 100%;
      background: transparent;
    }

ul {
    display: block;
    list-style-type: disc;
    margin-block-start: 1em;
    margin-block-end: 1em;
    margin-inline-start: 0px;
    margin-inline-end: 0px;
    padding-inline-start: 40px;
}

  body {
    margin: 0;
    padding: 0;
    border: 0;
    font-size: 16px;
    vertical-align: baseline;
    box-sizing: border-box;
  }

  article, aside, details, figcaption, figure,
  footer, header, hgroup, main, menu, nav, section {
    display: block;
  }

  abbr, address, article, aside, audio, b, blockquote, 
  canvas, caption, cite, code, dd, del, details, 
  dfn, div, dl, dt, em, fieldset, figcaption, figure, 
  footer, form, h1, h2, h3, h4, h5, h6, header, hgroup, 
  html, i, iframe, img, ins, kbd, label, legend, li, 
  mark, menu, nav, object, ol, p, pre, q, samp, section, 
  small, span, strong, summary, table, tbody, td, tfoot, 
  th, thead, time, tr, ul, var, video {
    margin: 0;
    padding: 0;
    border: 0;
    font-size: 100%;
    vertical-align: baseline;
    background: transparent;
  }

  ol, ul {
    list-style: none;
  }

h1, h2, h3, h4, h5, h6, .h1, .h2, .h3, .h4, .h5, .h6 {
    margin-bottom: 0.5rem;
    font-weight: 500;
    line-height: 1.2;
}

h1, h2, h3, h4, h5, h6 {
    margin-top: 0;
    margin-bottom: 0;
    color: inherit;
}
h1, h2, h3 {
    font-weight: 700;
}
  h1, .h1 {
    font-size: 40px;
    letter-spacing: -0.009em;
    line-height: 1.4;
    font-weight: bold;
}

h4, .h4 {
    letter-spacing: -0.009em;
    line-height: 1.6;
}

  blockquote, q {
    quotes: none;
  }
  blockquote:before, blockquote:after,
  q:before, q:after {
    content: none;
  }

  textarea:focus, input:focus, select:focus {
    box-shadow: 0 0 0 0;
    outline: #1771E6 solid 1;
    border: #1771E6 solid 1;
    font-size: 110%;
  }
  
  button {
    cursor: pointer;
    border:none;
    outline: none;
    background: transparent;
  }
  table {
    border-collapse: collapse;
    border-spacing: 0;
  }
  



  a {
    text-decoration: none;
    /* color: inherit; */
    a:link { text-decoration: none; color: inherit;}
    a:visited { text-decoration: none; color: inherit;}
    a:active { text-decoration: none; color: inherit;}
    a:hover { text-decoration: none; color: inherit;}
    transition-delay: initial;
    transition-duration: 0.08s;
    transition-property: all;
    transition-timing-function: ease-in-out;
    color: #0078FF;
    cursor: pointer;
  }

:root {
  --swiper-theme-color: #007aff;
  --swiper-navigation-size: 44px;
}

:root {
  /* 메인컬러   */
    --myblue-color: #1890FF;
    --purple-strong: #5c16c5;
    --purple-normal: #7136b5;
    --blue-weak: #4c5ace;
    --landing-background: #5297ff;
    --dashboard-background: #f2f2f2;
    --gray-button-pressed: #C8CAD2;
    --gray-button: #e5e5e5;
    --gray-button-text: #000;
    --blue-button-text: white;
    --blue-button: #015cab;
    --blue-button-pressed: #2C4D83;
    --background-color: #f0f2f5;
    --red-button: #E33F43;
    --red-button-reverse: #F7CDCE;
    --blue: #007bff;
    --indigo: #6610f2;
    --purple: #6f42c1;
    --pink: #e83e8c;
    --red: #dc3545;
    --orange: #fd7e14;
    --yellow: #ffc107;
    --green: #28a745;
    --teal: #20c997;
    --cyan: #17a2b8;
    --white: #fff;
    --gray: #6c757d;
    --gray-dark: #343a40;
    --primary: #007bff;
    --secondary: #6c757d;
    --success: #28a745;
    --info: #17a2b8;
    --warning: #ffc107;
    --danger: #dc3545;
    --light: #f8f9fa;
    --dark: #343a40;
     @media screen and (max-width: 640px) {
        --navbar-height: 52.39px;
    }
    @media screen and (min-width: 641px) and (max-width: 768px) {
        --navbar-height: 59px;
    }
    --navbar-height: 62px;
    --breakpoint-xs: 0;
    --breakpoint-sm: 576px;
    --breakpoint-md: 768px;
    --breakpoint-lg: 992px;
    --breakpoint-xl: 1200px;
    --font-family-sans-serif: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    --font-family-monospace: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
`;

export const theme = {
  colors: {
    primary: '#015CAB',
  },
};
