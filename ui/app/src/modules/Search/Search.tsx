/*
 * Copyright (C) 2007-2019 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { defineMessages, useIntl } from "react-intl";
import makeStyles from "@material-ui/core/styles/makeStyles";
import { Avatar, InputBase, MenuItem, Select, Theme } from "@material-ui/core";
import SearchIcon from '@material-ui/icons/Search';
import ImageIcon from '@material-ui/icons/Image';
import AppsIcon from '@material-ui/icons/Apps';
import Dialog from '@material-ui/core/Dialog';
import IconButton from '@material-ui/core/IconButton';
import Grid from "@material-ui/core/Grid";
import MediaCard from '../../components/MediaCard';
import { search } from "../../services/search";
import { setRequestForgeryToken } from "../../utils/auth";
import { Filter, MediaItem, Preview, SearchParameters, QueryParams } from "../../models/Search";
import Spinner from "../../components/SystemStatus/Spinner";
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import CloseIcon from '@material-ui/icons/Close';
import EmptyState from "../../components/SystemStatus/EmptyState";
import ViewListIcon from '@material-ui/icons/ViewList';
import FilterSearchDropdown from "./FilterSearchDropdown";
import queryString from "query-string";
import ErrorState from "../../components/SystemStatus/ErrorState";
import TablePagination from "@material-ui/core/TablePagination";
import Typography from "@material-ui/core/Typography";
import AsyncVideoPlayer from '../../components/AsyncVideoPlayer';
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import clsx from "clsx";
import Editor from "../../components/Editor";
import IFrame from '../../components/IFrame';
import { getPreviewURLFromPath } from '../../utils/path';
import { History, Location } from 'history';
import { getContent } from "../../services/content";

const useStyles = makeStyles((theme: Theme) => ({
  wrapper: {
    margin: 'auto',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    '&.hasContent': {
      height: 'inherit'
    },
    '&.select': {
      paddingBottom: '60px'
    }
  },
  searchHeader: {
    padding: '15px 20px',
    display: 'flex',
    borderBottom: '1px solid #EBEBF0',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#F3F3F3'
  },
  searchDropdown: {
    marginRight: '7px'
  },
  search: {
    position: 'relative',
    background: '#d8d8dc',
    width: '500px',
    display: 'flex',
    alignItems: 'center',
    padding: '5px 12px',
    borderRadius: '5px',
  },
  searchIcon: {
    marginLeft: '10px',
    fontSize: '30px',
    color: theme.palette.text.secondary
  },
  closeIcon: {
    marginLeft: '10px',
    fontSize: '30px',
    color: theme.palette.text.secondary,
    cursor: 'pointer'
  },
  inputRoot: {
    flexGrow: 1,
  },
  inputInput: {
    background: 'none',
    border: 'none',
    width: '100%',
    '&:focus': {
      boxShadow: 'none'
    }
  },
  assetSelector: {
    display: 'none',
    minWidth: '187px',
    padding: '10px 12px',
    background: 'rgba(0, 122, 255, 0.1)',
    borderRadius: '5px 0 0 5px',
    alignItems: 'center',
    marginLeft: 'auto',
    '& .select': {
      width: '100%'
    }
  },
  selectRoot: {
    width: '100%',
    color: '#007AFF',
    background: 'none',
    border: 'none',
    '&:focus': {
      boxShadow: 'none',
      background: 'none'
    }
  },
  selectIcon: {
    color: '#000000'
  },
  assetImage: {
    color: '#007AFF',
    fontSize: '30px',
    marginRight: '15px',
  },
  searchHelperBar: {
    display: 'flex',
    padding: '0 6px 0 20px',
    alignItems: 'center'
  },
  resultsSelected: {
    marginRight: '10px',
    display: 'flex',
    alignItems: 'center'
  },
  clearSelected: {
    marginLeft: '5px',
    cursor: 'pointer'
  },
  helperContainer: {
    display: 'flex',
    marginLeft: 'auto',
    alignItems: 'center'
  },
  avatarContent: {
    margin: 5,
    padding: 0,
  },
  avatar: {
    background: '#EBEBF0',
    color: '#8E8E93'
  },
  content: {
    flexGrow: 1,
    padding: '25px 30px',
    background: '#F3F3F3'
  },
  container: {},
  pagination: {
    marginLeft: 'auto',
    '& p': {
      padding: 0
    },
    '& svg': {
      top: 'inherit'
    }
  },
  dialogTitle: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: '10px',
    padding: '10px 0'
  },
  dialogCloseButton: {
    marginLeft: 'auto'
  },
  mediaPreview: {
    maxWidth: '700px',
    minWidth: '400px',
    minHeight: '200px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    '& img': {
      maxWidth: '100%'
    }
  },
  videoPreview: {}
}));

const initialSearchParameters: SearchParameters = {
  query: '',
  keywords: '',
  offset: 0,
  limit: 21,
  sortBy: '_score',
  sortOrder: 'asc',
  filters: {
    //'mime-type': ['image/png', 'image/jpeg']
  }
};

const messages = defineMessages({
  noResults: {
    id: 'search.noResults',
    defaultMessage: 'No Results Were Found.'
  },
  changeQuery: {
    id: 'search.changeQuery',
    defaultMessage: 'Try changing your query.'
  },
  videoProcessed: {
    id: 'search.videoProcessed',
    defaultMessage: 'Video is being processed, preview will be available when processing is complete'
  },
  selectAll: {
    id: 'search.selectAll',
    defaultMessage: 'Select all on this page'
  },
  resultsSelected: {
    id: 'search.resultsSelected',
    defaultMessage: '{count, plural, one {{count} item selected} other {{count} items selected}}',
  },
  itemsPerPage: {
    id: 'search.itemsPerPage',
    defaultMessage: 'Items per page:'
  }
});

interface SearchProps {
  history: History;
  location: Location;

  onEdit(path: string, refreshSearch: any, readonly: boolean): any;

  onDelete(path: string, refreshSearch: any): any;

  onPreview(url: string): any;

  onSelect(path: string, selected: boolean): any;

  onGetUserPermissions(path: string): any;

  mode: string;
  siteId: string;
  previewAppBaseUri: string;
}

function Search(props: SearchProps) {
  const classes = useStyles({});
  const {current: refs} = useRef<any>({});
  const {history, location, onEdit, onDelete, onPreview, onSelect, onGetUserPermissions, mode, siteId, previewAppBaseUri} = props;
  const queryParams = queryString.parse(location.search);
  const searchParameters = setSearchParameters(initialSearchParameters, queryParams);
  const [keyword, setKeyword] = useState(queryParams['keywords'] || '');
  const [currentView, setCurrentView] = useState('grid');
  const [searchResults, setSearchResults] = useState(null);
  const [selected, setSelected] = useState([]);
  const [preview, setPreview] = useState({
    url: null,
    type: null,
    name: null,
    open: false,
    data: null
  });
  const onSearch$ = useMemo(() => new Subject<string>(), []);
  const {formatMessage} = useIntl();
  const [apiState, setApiState] = useState({
    error: false,
    errorResponse: null,
  });

  refs.createQueryString = createQueryString;

  setRequestForgeryToken();

  useEffect(() => {
    search(siteId, searchParameters).subscribe(
      ({response}) => {
        setSearchResults(response.result);
      },
      ({response}) => {
        if (response) {
          setApiState({error: true, errorResponse: response.response});
        }
      }
    );
    return () => setApiState({error: false, errorResponse: null});
  }, [location.search, siteId]);

  useEffect(() => {
    const subscription = onSearch$.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((keywords: string) => {
      if (!keywords) keywords = undefined;
      let qs = refs.createQueryString({name: 'keywords', value: keywords});
      history.push({
        pathname: '/',
        search: `?${qs}`
      })
    });
    return () => subscription.unsubscribe();
  }, [history, onSearch$, refs]);

  function renderMediaCards(items: [MediaItem], currentView: string) {
    if (items.length > 0) {
      return items.map((item: MediaItem, i: number) => {
        return (
          (currentView === 'grid') ?
            <Grid key={i} item xs={12} sm={6} md={4} lg={3} xl={2}>
              <MediaCard
                item={item}
                currentView={currentView}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                handlePreview={handlePreview}
                handlePreviewAsset={handlePreviewAsset}
                handleSelect={handleSelect}
                selected={selected}
                onGetUserPermissions={onGetUserPermissions}
                mode={mode}
                previewAppBaseUri={previewAppBaseUri}
              />
            </Grid>
            :
            <Grid key={i} item xs={12}>
              <MediaCard
                item={item}
                currentView={currentView}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                handlePreview={handlePreview}
                handlePreviewAsset={handlePreviewAsset}
                handleSelect={handleSelect}
                selected={selected}
                onGetUserPermissions={onGetUserPermissions}
                mode={mode}
                previewAppBaseUri={previewAppBaseUri}
              />
            </Grid>
        )
      });

    } else {
      return <EmptyState title={formatMessage(messages.noResults)} subtitle={formatMessage(messages.changeQuery)}/>
    }
  }

  function handleSearchKeyword(keyword: string) {
    setKeyword(keyword);
    onSearch$.next(keyword);
  }

  function handleChangeView() {
    if (currentView === 'grid') {
      setCurrentView('list')
    } else {
      setCurrentView('grid')
    }
  }

  function handleFilterChange(filter: Filter, isFilter: boolean) {
    let qs = createQueryString(filter, isFilter);
    if (qs || location.search) {
      history.push({
        pathname: '/',
        search: `?${qs}`
      })
    } else {
      return false;
    }
  }

  // createQueryString:
  // isFilter: It means that the filter is nested on object filter
  function createQueryString(filter: Filter, isFilter = false) {
    let newFilters;
    let filters: any = queryParams['filters'];
    filters = filters ? JSON.parse(filters) : {};
    if (isFilter) {
      filters[filter.name] = filter.value;
      queryParams.filters = JSON.stringify(filters);
      if (queryParams.filters === '{}') {
        queryParams.filters = undefined;
      }
      newFilters = {...queryParams};
    } else {
      queryParams.filters = JSON.stringify(filters);
      if (queryParams.filters === '{}') {
        queryParams.filters = undefined;
      }
      newFilters = {...queryParams, [filter.name]: filter.value};
    }
    return queryString.stringify(newFilters);
  }

  function setSearchParameters(initialSearchParameters: SearchParameters, queryParams: QueryParams) {
    let formatParameters = {...queryParams};
    if (formatParameters.filters) {
      formatParameters.filters = JSON.parse(formatParameters.filters);
      Object.keys(formatParameters.filters).forEach((key) => {
        if (formatParameters.filters[key].includes('TODATE')) {
          let id = formatParameters.filters[key].split('ID');
          let range = id[0].split('TODATE');
          formatParameters.filters[key] = {
            date: true,
            id: id[1],
            min: (range[0] !== 'null') ? range[0] : null,
            max: (range[1] !== 'null') ? range[1] : null,
          }
        } else if (formatParameters.filters[key].includes('TO')) {
          let range = formatParameters.filters[key].split('TO');
          formatParameters.filters[key] = {
            min: (range[0] !== '-Infinity' && range[0] !== '') ? range[0] : null,
            max: (range[1] !== 'Infinity' && range[1] !== '') ? range[1] : null,
          }
        }

      })
    }
    return {...initialSearchParameters, ...formatParameters};
  }

  function handleChangePage(event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null, newPage: number) {
    let offset = newPage * searchParameters.limit;
    let qs = refs.createQueryString({name: 'offset', value: offset});
    history.push({
      pathname: '/',
      search: `?${qs}`
    })
  }

  function handleChangeRowsPerPage(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    let qs = refs.createQueryString({name: 'limit', value: parseInt(event.target.value, 10)});
    history.push({
      pathname: '/',
      search: `?${qs}`
    })
  }

  function refreshSearch() {
    search(siteId, searchParameters).subscribe(
      ({response}) => {
        setSearchResults(response.result);
      },
      ({response}) => {
        if (response) {
          setApiState({error: true, errorResponse: response})
        }
      }
    );
  }

  function handleEdit(path: string, readonly: boolean) {
    onEdit(path, refreshSearch, readonly);
  }

  function handleDelete(path: string) {
    onDelete(path, refreshSearch);
  }

  function handlePreview(url: string) {
    onPreview(url);
  }

  function handlePreviewAsset(url: string, type: string, name: string) {
    if (type === 'Template' || type === 'Groovy') {
      getContent(siteId, url).subscribe(
        (response) => {
          setPreview({url, open: true, type, name, data: response});
        }
      );
    } else
    {
      setPreview({url, open: true, type, name, data: null});
    }
  }

  function handleClosePreview() {
    setPreview({...preview, url: null, open: false, type: null, name: null, data: null});
  }

  function handleSelect(path: string, isSelected: boolean) {
    if (isSelected) {
      setSelected([...selected, path])
    } else {
      let selectedItems = [...selected];
      let index = selectedItems.indexOf(path);
      selectedItems.splice(index, 1);
      setSelected(selectedItems);
    }
    onSelect(path, isSelected);
  }

  function handleSelectAll(checked: boolean) {
    if (checked) {
      let selectedItems: any[] = [];
      searchResults.items.forEach((item: any) => {
        if (selected.indexOf(item.path) === -1) {
          selectedItems.push(item.path);
          onSelect(item.path, true);
        }
      });
      setSelected([...selected, ...selectedItems]);
    } else {
      let newSelectedItems = [...selected];
      searchResults.items.forEach((item: any) => {
        let index = newSelectedItems.indexOf(item.path);
        if (index >= 0) {
          newSelectedItems.splice(index, 1);
          onSelect(item.path, false);
        }
      });
      setSelected(newSelectedItems);
    }
  }

  function handleClearSelected() {
    selected.forEach(path => {
      onSelect(path, false);
    });
    setSelected([]);
  }

  function areAllSelected() {
    if (!searchResults || searchResults.items.length === 0) return false;
    return !searchResults.items.some((item: any) => !selected.includes(item.path));
  }

  function renderPreview(preview: Preview) {
    switch (preview.type) {
      case 'Image':
        return <img src={preview.url} alt=''/>;
      case 'Video':
        return <AsyncVideoPlayer playerOptions={{src: preview.url, autoplay: true}}
                                 nonPlayableMessage={formatMessage(messages.videoProcessed)}/>;
      case 'Page':
        return <IFrame url={getPreviewURLFromPath(previewAppBaseUri, preview.url)} name={preview.name} width={960}
                       height={600}/>;
      case 'Template':
        return <Editor mode={'ace/mode/html'} data={preview.data}/>;
      case 'Groovy':
        return <Editor mode={'ace/mode/java'} data={preview.data}/>;
      default:
        break;
    }
  }

  return (
    <section className={
      clsx(classes.wrapper, {
        'hasContent': (searchResults && searchResults.total),
        'select': mode === 'select'
      })
    }>
      <header className={classes.searchHeader}>
        <div className={classes.assetSelector}>
          <ImageIcon className={classes.assetImage}/>
          <Select
            labelId="asset-selector-label"
            id="asset-selector"
            value="all"
            className='select'
            classes={{
              root: classes.selectRoot,
              icon: classes.selectIcon
            }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value={10}>Content</MenuItem>
            <MenuItem value={20}>Twenty</MenuItem>
            <MenuItem value={30}>Thirty</MenuItem>
          </Select>
        </div>
        <div className={classes.search}>
          <InputBase
            onChange={e => handleSearchKeyword(e.target.value)}
            placeholder="Search…"
            value={keyword}
            classes={{
              root: classes.inputRoot,
              input: classes.inputInput,
            }}
            inputProps={{'aria-label': 'search'}}
          />
          {
            keyword
              ? <CloseIcon className={classes.closeIcon} onClick={() => handleSearchKeyword('')}/>
              : <SearchIcon className={classes.searchIcon}/>
          }
        </div>
        <div className={classes.helperContainer}>
          {
            searchResults && searchResults.facets &&
            <FilterSearchDropdown
              text={'Filters'}
              className={classes.searchDropdown}
              facets={searchResults.facets}
              handleFilterChange={handleFilterChange}
              queryParams={queryParams}
            />
          }
          <IconButton className={classes.avatarContent} onClick={handleChangeView}>
            <Avatar className={classes.avatar}>
              {
                currentView === 'grid' ?
                  <ViewListIcon/>
                  :
                  <AppsIcon/>
              }
            </Avatar>
          </IconButton>
        </div>
      </header>
      {
        (searchResults && !!searchResults.total) &&
        <div className={classes.searchHelperBar}>
          <FormGroup>
            <FormControlLabel
              control={<Checkbox color="primary" checked={areAllSelected()}
                                 onClick={(e: any) => handleSelectAll(e.target.checked)}/>}
              label={formatMessage(messages.selectAll)}
            />
          </FormGroup>
          {
            (selected.length > 0) &&
            <Typography variant="body2" className={classes.resultsSelected} color={"textSecondary"}>
              {formatMessage(messages.resultsSelected, {
                count: selected.length,
                total: searchResults.total
              })}
              <HighlightOffIcon className={classes.clearSelected} onClick={handleClearSelected}/>
            </Typography>
          }
          <TablePagination
            rowsPerPageOptions={[9, 15, 21]}
            className={classes.pagination}
            component="div"
            labelRowsPerPage={formatMessage(messages.itemsPerPage)}
            count={searchResults.total}
            rowsPerPage={searchParameters.limit}
            page={searchParameters.offset / searchParameters.limit}
            backIconButtonProps={{
              'aria-label': 'previous page',
            }}
            nextIconButtonProps={{
              'aria-label': 'next page',
            }}
            onChangePage={handleChangePage}
            onChangeRowsPerPage={handleChangeRowsPerPage}
          />
        </div>
      }
      <section className={classes.content}>
        {
          apiState.error ?
            <ErrorState error={apiState.errorResponse}/> :
            (
              <Grid container spacing={3} className={classes.container}>
                {searchResults === null ?
                  <Spinner background="inherit"/> : renderMediaCards(searchResults.items, currentView)}
              </Grid>
            )
        }
      </section>
      <Dialog onClose={handleClosePreview} aria-labelledby="preview" open={preview.open} maxWidth='md'>
        <div className={classes.dialogTitle}>
          <Typography variant="h6">{preview.name}</Typography>
          <IconButton aria-label="close" className={classes.dialogCloseButton} onClick={handleClosePreview}>
            <CloseIcon/>
          </IconButton>
        </div>
        <div className={classes.mediaPreview}>
          {renderPreview(preview)}
        </div>
      </Dialog>
    </section>
  )
}

export default Search;
