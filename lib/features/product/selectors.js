import { createSelector } from '@reduxjs/toolkit'

export const selectProducts = (state) => state.product.list

export const selectLatestProducts = createSelector(
  [selectProducts],
  (products) => products
    .filter((product) => product.isNewArrival)
    .toSorted((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
)

export const selectBestSellingProducts = createSelector(
  [selectProducts],
  (products) => products
    .toSorted((a, b) => (b.rating?.length || 0) - (a.rating?.length || 0)),
)
