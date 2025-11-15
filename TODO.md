# TODO: Update Promotion and Redemption System

## 1. Update storage.js Schema
- [ ] Change promotion schema: remove 'discount', 'startDate', 'endDate'; add 'value', 'photo', 'instagramLink'
- [ ] Change redeem schema: remove 'name', 'value', 'type'; add 'productId', 'pointsRequired'

## 2. Update admin.html Modals
- [ ] Add proper promotion modal with fields: name, value, description, photo (file upload), instagramLink
- [ ] Add proper redeem modal with fields: select product dropdown, points required

## 3. Update js/admin.js Logic
- [ ] Update setupPromotionsSection() to use new modal instead of prompts
- [ ] Update setupRedeemSection() to use new modal instead of prompts
- [ ] Add form handling for new promotion fields (file upload for photo)
- [ ] Add form handling for new redeem fields (product selection)

## 4. Update index.html
- [ ] Remove hardcoded promocoesLinks array
- [ ] Load promotions from storage instead of hardcoded links
- [ ] Conditionally show promotions section only if promotions exist

## 5. Update promocoes.js
- [ ] Modify renderPromocoes to accept promotion objects instead of just links
- [ ] Render either image or instagram embed based on promotion data
- [ ] Hide promotions section if no promotions

## 6. Testing
- [ ] Test creating promotions with images and instagram links
- [ ] Test creating product-based redemptions
- [ ] Test homepage shows promotions correctly
- [ ] Test homepage hides promotions when none exist
