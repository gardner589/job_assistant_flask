import requests
from bs4 import BeautifulSoup


def scrape_job_posting(url):
    headers = {
        'User-Agent': (
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
            'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
    }
    resp = requests.get(url, headers=headers, timeout=15)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, 'html.parser')

    for tag in soup(['script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe']):
        tag.decompose()

    # Try known job board selectors first
    candidates = [
        soup.find(attrs={'data-testid': 'jobDescriptionText'}),   # Indeed
        soup.find(class_='description__text'),                     # LinkedIn
        soup.find(id='job-details'),
        soup.find(class_='job-description'),
        soup.find(class_='jobsearch-jobDescriptionText'),
        soup.find('article'),
        soup.find('main'),
    ]

    content = ''
    for el in candidates:
        if el:
            text = el.get_text(separator=' ', strip=True)
            if len(text) > 200:
                content = text
                break

    if not content and soup.body:
        content = soup.body.get_text(separator=' ', strip=True)

    title = ''
    if soup.title and soup.title.string:
        title = soup.title.string.split('|')[0].split('–')[0].split('-')[0].strip()
    if not title and soup.h1:
        title = soup.h1.get_text(strip=True)

    company = ''
    og_site = soup.find('meta', property='og:site_name')
    if og_site:
        company = og_site.get('content', '')

    return {'content': content, 'title': title, 'company': company}
