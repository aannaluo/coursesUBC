# coursesUBC (WIP Last updated: Oct 17, 2024)
A full stack development project for that queries through historical UBC course data

Application demonstration upon request.

Code directory private

# Checkpoint 0
Implemented black box testing for our four main functions (addDataset, removeDataset, listDatasets, performQuery)

# Checkpoint 1
Implemented functions for sections and courses. 
Allows for querying following EBNF specifications.

> **EBNF QUERY:_**
> 
> QUERY ::='{' BODY ', ' OPTIONS '}'
> 
> // Note: a BODY with no FILTER (i.e. WHERE:{}) matches all entries.
>
> BODY ::= 'WHERE:{' FILTER? '}'
>
> FILTER ::= LOGICCOMPARISON | MCOMPARISON | SCOMPARISON | NEGATION
>
> LOGICCOMPARISON ::= LOGIC ':[' FILTER_LIST ']'
>
> MCOMPARISON ::= MCOMPARATOR ':{' mkey ':' number '}'
>
> SCOMPARISON ::= 'IS:{' skey ': "' [*]? inputstring [*]? '" }'  // Asterisks at the beginning or end of the inputstring should act as wildcards.
>
> NEGATION ::= 'NOT :{' FILTER '}'
>
> FILTER_LIST ::= '{' FILTER '}' | '{' FILTER '}, ' FILTER_LIST // comma separated list of filters containing at least one filter
> 
> LOGIC ::= 'AND' | 'OR'
> 
> MCOMPARATOR ::= 'LT' | 'GT' | 'EQ'
>
> OPTIONS ::= 'OPTIONS:{' COLUMNS '}' | 'OPTIONS:{' COLUMNS ', ORDER:' key '}'
>
> COLUMNS ::= 'COLUMNS:[' KEY_LIST ']'
>
> KEY_LIST ::= key | key ', ' KEY_LIST // comma separated list of keys containing at least one key
>
> key ::= mkey | skey
>
> mkey ::= '"' idstring '_' mfield '"'
>
> skey ::= '"' idstring '_' sfield '"'
>
> mfield ::= 'avg' | 'pass' | 'fail' | 'audit' | 'year'
>
> sfield ::=  'dept' | 'id' | 'instructor' | 'title' | 'uuid'
>
> idstring ::= [^_]+ // One or more of any character, except underscore.
>
> inputstring ::= [^*]* // Zero or more of any character, except asterisk.


Note: Files uploaded are the main files my project partner and I were in charge of, complete repository is not uploaded due to clutter.
