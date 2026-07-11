/* eslint-disable @typescript-eslint/no-explicit-any */
import { Badge, Input, Tooltip } from "antd";
import React, { useState, useRef, useCallback } from "react";
import "./index.scss";
import { ListFilterPlus, Search } from "lucide-react";

// Export the interface so it can be imported by other components
export interface InputSearchProps {
  id?: string;
  placeholder?: string;
  onInput?: (event: any) => void;
  onSearch?: (value: string) => void;
  onPressEnter?: () => void; // Thêm thuộc tính onPressEnter

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gridRef?: React.RefObject<any>;
  idSearch?: string | "filter-text-box";

  // New filter-related props
  enableFilterButton?: boolean;
  onFilterClick?: () => void;
  isFiltered?: boolean;
  filteredCount?: number;
  onResetFilter?: () => void;

  // New tooltip text props
  filterTooltip?: string;
  resetTooltip?: string;
  searchTooltip?: string;

  // New props for filter information
  filterSummary?: string;
  filterCount?: number;
  onInputValueChange?: (value: string) => void;
}

const InputSearch: React.FC<InputSearchProps> = ({
  id,
  placeholder = "Tìm kiếm...",
  onSearch,
  onPressEnter,
  onInput,
  gridRef,
  idSearch = "filter-text-box",
  // Filter props with defaults
  enableFilterButton = true,
  onFilterClick,
  isFiltered = false,
  // onResetFilter,
  filterTooltip = "Mở bộ lọc",
  // resetTooltip = "Clear",
  searchTooltip = "Tìm kiếm",
  filterCount = 0,
  onInputValueChange,
}) => {
  const [inputValue, setInputValue] = useState<string>("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (onInputValueChange) {
      if (e.target.value === "") {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        onInputValueChange(""); // Gọi ngay nếu rỗng
      } else {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          onInputValueChange(e.target.value);
        }, 300); // 300ms debounce
      }
    }
  };

  const handleSearch = () => {
    if (enableFilterButton && onFilterClick) {
      onFilterClick(); // Call filter function if enabled
    } else if (onSearch) {
      onSearch(inputValue); // Otherwise call regular search
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (onSearch) onSearch(inputValue); // Gọi hàm onSearch khi nhấn Enter
      if (onPressEnter) onPressEnter(); // Gọi hàm onPressEnter khi nhấn Enter
    }
  };

  const onFilterTextBoxChanged = useCallback(() => {
    if (gridRef?.current?.api) {
      const inputElement = document.getElementById(
        `${idSearch}`,
      ) as HTMLInputElement;
      if (inputElement) {
        gridRef.current.api.setGridOption(
          "quickFilterText",
          inputElement.value,
        );
      }
    }
  }, [idSearch, gridRef]);

  // Choose appropriate icon based on whether filter mode is enabled
  const iconComponent = enableFilterButton ? (
    <div className="filter-icon-container" onClick={handleSearch}>
      <Tooltip title={filterTooltip} placement="top">
        {isFiltered ? (
          // Only show the reset overlay when isFiltered is true
          <div className="filter-with-reset">
            <Badge count={filterCount > 0 ? filterCount : 0} size="small">
              <ListFilterPlus size={16} className="search__icon" />
            </Badge>
          </div>
        ) : (
          // Regular filter icon when not filtered
          <ListFilterPlus size={16} className="search__icon" />
        )}
      </Tooltip>
    </div>
  ) : (
    <Tooltip title={searchTooltip} placement="top">
      <ListFilterPlus
        size={20}
        className="search__icon"
        onClick={handleSearch}
      />
    </Tooltip>
  );

  return (
    <div className="input-search-container">
      <Input
        id={id || idSearch}
        onInput={onInput ? onInput : onFilterTextBoxChanged}
        type="text"
        className="search"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        suffix={iconComponent}
      />
    </div>
  );
};

export default InputSearch;
