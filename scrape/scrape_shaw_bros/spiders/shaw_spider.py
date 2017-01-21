
# -*- coding: utf-8 -*-
'''
SPIDER
'''
import scrapy
import urlparse

from scrape_shaw_bros.items import Movie

class ShawSpider(scrapy.Spider):
    '''
    SPIDER
    '''

    name = 'shaw'
    allowed_domains = ['letterboxd.com']

    start_urls = ['https://letterboxd.com/jewbo23/list/shaw-brothers-martial-arts-films/detail/']

    def parse(self, response):
        # links = response.xpath("//a[contains(@href, '/c/')]/@href")
        links = response.xpath("//h2/a[contains(@href, '/film/')]/@href")
        for href in links:
            url = response.urljoin(href.extract())
            # url = "http://letterboxd.com" + href.extract()
            yield scrapy.Request(url, callback=self.parse_movie_page)
            # break

        next_page = response.css(".paginate-next::attr(href)").extract_first()
        if next_page is not None:
            # next_page = "http://letterboxd.com" + next_page
            next_page = response.urljoin(next_page)
            yield scrapy.Request(next_page, callback=self.parse)

    def parse_movie_page(self, response):
        movie = Movie()
        # title
        title_css = "h1.headline-1::text"
        title = response.css(title_css).extract_first()
        movie['title'] = title

        # year
        year = response.css("#featured-film-header p small a::text").extract_first()
        movie['year'] = year

        # description
        description = response.css(".col-main .body-text p::text").extract_first()
        movie['description'] = description

        # cast
        cast = response.css(".cast-list a span::text").extract()
        cast_o = [{"name" : n} for n in cast]
        movie['cast'] = cast_o

        # director
        director = response.xpath("//div[@id='tab-crew']/div/p/a[contains(@href, '/director/')]/text()").extract_first()
        movie['director'] = director

        # characters
        characters = response.css(".cast-list a::attr(title)").extract()
        characters_o = [{"name" : n} for n in characters]
        movie['characters'] = characters_o

        # rating
        rating = response.css(".average-rating .display-rating::text").extract_first()
        if rating is not None:
            rating = float(rating)
        movie['avg_rating'] = rating

        watches = response.css(".filmstat-watches a::text").extract_first()
        if watches is not None:
            watches = int(watches)
        movie['watches'] = watches

        likes = response.css(".filmstat-likes a::text").extract_first()
        if likes is not None:
            likes = int(likes)
        movie['likes'] = likes

        movie['url'] = response.url


        yield movie
