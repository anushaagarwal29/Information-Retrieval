import requests
from django.shortcuts import render
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from .forms import SearchForm

def search_view(request):
    form = SearchForm(request.GET or None)
    context = {'form': form}
    results_per_page = 10  # Number of results per page

    if form.is_valid():
        user_query = form.cleaned_data.get('query')
        solr_query = f'Text:"{user_query}"'
        solr_url = 'http://localhost:8983/solr/new_core/select'
        page = request.GET.get('page', 1)

        start_index = (int(page) - 1) * results_per_page

        params = {
            'q': solr_query,
            'wt': 'json',
            'start': start_index,
            'rows': results_per_page,
        }
        response = requests.get(solr_url, params=params)

        if response.status_code == 200:
            data = response.json()
            search_results = data['response']['docs']
            for result in search_results:
                result['Text'] = result['Text'][0]

            total_results = data['response']['numFound']

            paginator = Paginator(range(total_results), results_per_page) # Create a paginator with the total count

            try:
                # Fetch the page from the paginator, but we will display the results from Solr
                current_page = paginator.page(page)
            except PageNotAnInteger:
                current_page = paginator.page(1)
            except EmptyPage:
                current_page = paginator.page(paginator.num_pages)

            context.update({
                'search_results': search_results, # Display results from Solr
                'page_obj': current_page, # Pass the page object to the template for pagination controls
            })

    return render(request, 'search/search.html', context)
