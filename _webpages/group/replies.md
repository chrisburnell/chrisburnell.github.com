---
page_class: page--replies
searchable: no-content

title: Replies
lede: All of my replies.

feed: /replies.xml
---

{%- assign replies = site.posts | where_exp: 'page', 'page.in_reply_to != nil' -%}

*There are {{ replies | size }} published Replies.*

<div class="h-feed" id="replies">
    {% for page in replies %}
        {%- assign page_year = page.date | date: '%Y' -%}

        {% if page_year != current_year %}
            {% assign current_year = page_year %}
            {% unless forloop.first %}
                </ol>
            {% endunless %}
            {% include_cached content/heading.liquid title=page_year id=page_year %}
            <ol class="content-list" role="list">
        {% endif %}

        {% include components/item_content_list.liquid %}

        {% if forloop.last %}
            </ol>
        {% endif %}
    {% endfor %}
</div>

--------

{% include components/buttons_categories.liquid %}