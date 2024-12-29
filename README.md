# coursesUBC

### Link to view the full stack project.
https://youtu.be/QO4Fbw4t08w

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

# Checkpoint 2
Extended functionality to add rooms on UBC campus

Extended Querying functionality to sort by direction as well as group and aggregate results. Additionally had to extend functionality to allow rooms to be queried

> **EBNF QUERY:_**
> 
> QUERY ::='{' BODY ', ' OPTIONS '}' | '{' BODY ', ' OPTIONS ', ' TRANSFORMATIONS '}'
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
> OPTIONS ::= 'OPTIONS:{' COLUMNS '}' | 'OPTIONS:{' COLUMNS ', ' SORT '}'
> 
> SORT ::= 'ORDER: { dir:'  DIRECTION ', keys: [ ' ANYKEY_LIST '] }' | 'ORDER: ' ANYKEY
> 
> DIRECTION ::= 'UP' | 'DOWN'
> 
> TRANSFORMATIONS ::= 'TRANSFORMATIONS: {' GROUP ', ' APPLY '}'
>
> GROUP ::= 'GROUP: [' KEY_LIST ']'
> 
> APPLY ::= 'APPLY: [' APPLYRULE_LIST? ']'
> 
> APPLYRULE_LIST ::=  APPLYRULE | APPLYRULE ', ' APPLYRULE_LIST
> 
> APPLYRULE ::= '{' applykey ': {' APPLYTOKEN ':' KEY '} }'
> 
> APPLYTOKEN ::= 'MAX' | 'MIN' | 'AVG' | 'COUNT' | 'SUM'
> 
> COLUMNS ::= 'COLUMNS:[' ANYKEY_LIST ']'
>
> KEY_LIST ::= key | key ', ' KEY_LIST // comma separated list of keys containing at least one key
> 
> ANYKEY_LIST ::= ANYKEY | ANYKEY ', ' ANYKEY_LIST
> 
> ANYKEY ::= KEY | applykey
> 
> key ::= mkey | skey
>
> mkey ::= '"' idstring '_' mfield '"'
>
> skey ::= '"' idstring '_' sfield '"'
>
> mfield ::= 'avg' | 'pass' | 'fail' | 'audit' | 'year' | 'lat' | 'lon' | 'seats'
>
> sfield ::=  'dept' | 'id' | 'instructor' | 'title' | 'uuid' | 'fullname' | 'shortname' | 'number' | 'name' | 'address' | 'type' | 'furniture' | 'href'
>
> idstring ::= [^_]+ // One or more of any character, except underscore.
>
> inputstring ::= [^*]* // Zero or more of any character, except asterisk.
> 
> applykey ::= [^_]+ // One or more of any character, except underscore.

# Checkpoint 3

Implement the server and frontend of the application. We made it compatible the sections kind, so users can view past sections.

