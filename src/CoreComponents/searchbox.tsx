import * as React from 'react';
import { SearchBox } from '@fluentui/react';
import { initializeIcons } from '@fluentui/react/lib/Icons';

initializeIcons();

export interface ISearchComponentProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
}

const SearchComponent: React.FC<ISearchComponentProps> = ({
  placeholder = 'Search...',
  onSearch,
}) => {

  const _onSearch = (newValue: string | undefined) => {
    if (onSearch && newValue) {
      onSearch(newValue);
    }
  };

  return (
    <SearchBox
      placeholder={placeholder}
      onSearch={_onSearch}
      onChange={(e, newValue) => console.log('Changed:', newValue)}
      underlined={false}
      className='search-Box'
    />
  );
};

export default SearchComponent;
