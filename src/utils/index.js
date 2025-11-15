export function createPageUrl(pageName) {
  const pageMap = {
    'Home': '/',
    'About': '/about',
    'Analysis': '/analysis',
    'HowItWorks': '/how-it-works',
    'Safety': '/safety',
  };
  
  return pageMap[pageName] || '/';
}

