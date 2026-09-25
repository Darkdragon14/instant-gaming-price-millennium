export const STYLES = `
#millennium-instant-gaming-price {
  box-sizing: border-box;
  margin: 30px 0 50px;
  padding: 2px;
  border-radius: 7px;
  background: linear-gradient(10deg, #ff8000, transparent) #ff4020;
  color: #fff;
}

#millennium-instant-gaming-price .migp-card {
  box-sizing: border-box;
  min-height: 69px;
  padding: 14px 15px;
  border-radius: 6px;
  background: linear-gradient(315deg, #303030, transparent) #101010;
  display: flex;
  align-items: center;
  gap: 18px;
  position: relative;
  font-family: Arial, sans-serif;
}

#millennium-instant-gaming-price .migp-brand {
  display: flex;
  align-items: center;
  gap: 9px;
  flex: 0 0 auto;
  color: #fff;
  text-decoration: none;
  line-height: 1;
}

#millennium-instant-gaming-price .migp-logo {
  display: block;
  width: 145px;
  height: auto;
  max-height: 42px;
}

#millennium-instant-gaming-price .migp-title {
  min-width: 0;
  margin-right: auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 18px;
}

#millennium-instant-gaming-price .migp-data {
  position: absolute;
  right: 14px;
  bottom: -29px;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: calc(100% - 28px);
  box-sizing: border-box;
  padding: 4px;
  border-radius: 7px;
  background: #101010;
  box-shadow: 0 4px 14px rgba(0, 0, 0, .24);
}

#millennium-instant-gaming-price .migp-discount {
  color: #ff632c;
  white-space: nowrap;
  font-size: 18px;
}

#millennium-instant-gaming-price .migp-price {
  color: #fff;
  white-space: nowrap;
  font-size: 18px;
}

#millennium-instant-gaming-price .migp-buy {
  box-sizing: border-box;
  padding: 7px 14px 8px;
  border-radius: 4px;
  background: linear-gradient(10deg, #ff8000, transparent) #ff4020;
  color: #fff;
  text-decoration: none;
  text-align: center;
  white-space: nowrap;
  font-size: 15px;
  transition: background-color .2s, transform .1s;
}

#millennium-instant-gaming-price .migp-buy:hover {
  background-color: #ff2020;
}

#millennium-instant-gaming-price .migp-buy:active {
  transform: translateY(1px);
}

.migp-wishlist-row {
  box-sizing: border-box;
  display: grid;
  align-items: center;
  justify-content: end;
  gap: 0;
  margin: 0 2px 8px;
  white-space: nowrap;
  font-family: Arial, sans-serif;
  line-height: 1;
}

.migp-wishlist-button {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: var(--migp-wishlist-control-height, 36px);
  padding: 6px 12px;
  border-radius: 0 3px 3px 0;
  background: linear-gradient(135deg, #ff7a00, #ff4524);
  color: #fff !important;
  text-decoration: none !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .3);
  transition: filter .15s, transform .1s;
}

.migp-wishlist-button:hover {
  filter: brightness(1.12);
}

.migp-wishlist-button:active {
  transform: translateY(1px);
}

.migp-wishlist-logo {
  display: block;
  width: 96px;
  max-width: 100%;
  max-height: 20px;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.migp-wishlist-price {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  height: var(--migp-wishlist-control-height, 36px);
  padding: 0 9px;
  border-radius: 3px 0 0 3px;
  background: rgba(13, 20, 29, .72);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  text-align: right;
}

@media (max-width: 760px) {
  #millennium-instant-gaming-price .migp-card { gap: 10px; padding: 11px; }
  #millennium-instant-gaming-price .migp-logo { width: 112px; }
  #millennium-instant-gaming-price .migp-title { font-size: 15px; }
  #millennium-instant-gaming-price .migp-price,
  #millennium-instant-gaming-price .migp-discount { font-size: 15px; }
  #millennium-instant-gaming-price .migp-buy { padding: 6px 9px 7px; font-size: 13px; }
  .migp-wishlist-button { padding: 5px 8px; }
  .migp-wishlist-logo { width: 82px; }
  .migp-wishlist-price { font-size: 12px; }
}
`;
