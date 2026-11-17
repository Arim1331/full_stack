import React from "react";
import * as S from "./style";
import MyRecipeCard from "./MyRecipeCard";

const MyRecipeGrid = ({ items, onCardClick, onToggleBookmark }) => {
  return (
    <S.ListGrid>
      {items.map((item) => (
        <MyRecipeCard
          key={item.id}
          item={item}
          variant="list"
          onClick={() => onCardClick?.(item.id)}
          onToggleBookmark={() => onToggleBookmark?.(item.id)}
        />
      ))}
    </S.ListGrid>
  );
};

export default MyRecipeGrid;
