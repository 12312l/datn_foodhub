package com.website.backend.seeder;

import com.website.backend.entity.*;
import com.website.backend.repository.*;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductMediaRepository productMediaRepository;
    private final ProductRatingRepository productRatingRepository;
    private final ReviewRepository reviewRepository;
    private final FavoriteRepository favoriteRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderRepository orderRepository;
    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntityManager entityManager;

    @Value("${app.seed.force:false}")
    private boolean forceSeed;

    @Override
    @Transactional
    public void run(String... args) {
        boolean hasSeededData = categoryRepository.count() > 0 || productRepository.count() > 0;
        if (hasSeededData && !forceSeed) {
            log.info("Database already seeded, skipping...");
            return;
        }

        if (hasSeededData) {
            log.info("Force reseed enabled. Clearing old seed data...");
            clearOldSeedData();
        }

        log.info("Seeding database...");

        // Create categories
        List<Category> categories = createCategories();

        // Create products with media
        createProducts(categories);

        // Create coupons
        createCoupons();

        // Create admin user
        createDefaultUsers();

        log.info("Database seeding completed!");
    }

    private void clearOldSeedData() {
        // Clear dependent data first to avoid foreign-key conflicts while reseeding catalog.
        cartItemRepository.deleteAllInBatch();
        favoriteRepository.deleteAllInBatch();
        reviewRepository.deleteAllInBatch();
        productRatingRepository.deleteAllInBatch();
        orderItemRepository.deleteAllInBatch();
        couponUsageRepository.deleteAllInBatch();
        orderRepository.deleteAllInBatch();

        // Attribute table may not be cascade-deleted depending on existing schema constraints.
        entityManager.createNativeQuery("DELETE FROM product_variant_attributes").executeUpdate();
        productVariantRepository.deleteAllInBatch();
        productMediaRepository.deleteAllInBatch();
        productRepository.deleteAllInBatch();
        categoryRepository.deleteAllInBatch();
        couponRepository.deleteAllInBatch();
    }

    private List<Category> createCategories() {
        List<Category> categories = List.of(
            Category.builder().name("Hamburger").description("Các loại hamburger").build(),
            Category.builder().name("Pizza").description("Pizza Ý").build(),
            Category.builder().name("Gà").description("Gà chiên và gà nướng").build(),
            Category.builder().name("Cơm").description("Các món cơm").build(),
            Category.builder().name("Mì").description("Các món mì").build(),
            Category.builder().name("Đồ uống").description("Nước uống").build(),
            Category.builder().name("Tráng miệng").description("Món tráng miệng ngọt").build(),
            Category.builder().name("Đồ ăn vặt").description("Các món ăn vặt").build()
        );

        return categoryRepository.saveAll(categories);
    }

    private void createProducts(List<Category> categories) {
        // Hamburgers
        createProductWithMedia(
            "Hamburger Classic",
            "Hamburger bò nướng than với rau tươi và sốt house",
            new BigDecimal("45000"),
            categories.get(0),
            true,
            24,
            "Bánh burger, bò xay 100g, phô mai cheddar, xà lách, cà chua, dưa leo muối, sốt mayonnaise",
            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
            List.of(
                buildVariant("S", "45000", "45000", 8, true, new String[][]{{"Size", "S"}}),
                buildVariant("M", "55000", "52000", 9, false, new String[][]{{"Size", "M"}}),
                buildVariant("L", "65000", "62000", 7, false, new String[][]{{"Size", "L"}})
            )
        );

        createProductWithMedia(
            "Hamburger Phô Mai",
            "Burger bò phủ phô mai kép, béo ngậy và đậm vị",
            new BigDecimal("55000"),
            categories.get(0),
            true,
            18,
            "Bánh burger, bò xay, phô mai cheddar, phô mai mozzarella, hành tím, xà lách, sốt burger",
            "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400",
            List.of()
        );

        createProductWithMedia(
            "Hamburger Gà",
            "Burger gà giòn bên ngoài, mềm mọng bên trong",
            new BigDecimal("40000"),
            categories.get(0),
            true,
            20,
            "Bánh burger, ức gà tẩm bột, xà lách, cà chua, sốt tartar",
            "https://images.unsplash.com/photo-1532635241-17e820acc59f?w=400",
            List.of(
                buildVariant("Thường", "40000", "40000", 10, true, new String[][]{{"Vị", "Thường"}}),
                buildVariant("Cay", "42000", "42000", 10, false, new String[][]{{"Vị", "Cay"}})
            )
        );

        // Pizza
        createProductWithMedia(
            "Pizza Margherita",
            "Pizza cổ điển với sốt cà chua Ý và lá húng quế tươi",
            new BigDecimal("120000"),
            categories.get(1),
            true,
            16,
            "Bột pizza lên men, sốt cà chua, mozzarella, parmesan, lá basil, dầu olive",
            "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400",
            List.of()
        );

        createProductWithMedia(
            "Pizza Pepperoni",
            "Pizza đậm vị với pepperoni Mỹ và phô mai kéo sợi",
            new BigDecimal("140000"),
            categories.get(1),
            true,
            14,
            "Đế pizza, sốt cà chua, mozzarella, xúc xích pepperoni, oregano",
            "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400",
            List.of(
                buildVariant("Vừa", "140000", "135000", 8, true, new String[][]{{"Kích thước", "Vừa"}}),
                buildVariant("Lớn", "180000", "170000", 6, false, new String[][]{{"Kích thước", "Lớn"}})
            )
        );

        createProductWithMedia(
            "Pizza Hawaii",
            "Sự kết hợp hài hòa giữa thịt ham mặn và dứa ngọt",
            new BigDecimal("130000"),
            categories.get(1),
            true,
            12,
            "Đế pizza, sốt cà chua, mozzarella, ham, dứa, oregano",
            "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
            List.of()
        );

        // Chicken
        createProductWithMedia(
            "Gà Chiên Giòn",
            "Gà tẩm bột chiên vàng giòn, ăn kèm sốt mật ong",
            new BigDecimal("35000"),
            categories.get(2),
            true,
            30,
            "Đùi gà/cánh gà, bột chiên giòn, bột tỏi, tiêu đen, sốt mật ong",
            "https://images.unsplash.com/photo-1626645738196-c2a72c7d6684?w=400",
            List.of(
                buildVariant("2 miếng", "35000", "35000", 18, true, new String[][]{{"Khẩu phần", "2 miếng"}}),
                buildVariant("4 miếng", "65000", "62000", 12, false, new String[][]{{"Khẩu phần", "4 miếng"}})
            )
        );

        createProductWithMedia(
            "Gà Nướng",
            "Gà nướng thảo mộc thơm mềm, ít dầu mỡ",
            new BigDecimal("55000"),
            categories.get(2),
            true,
            18,
            "Đùi gà, rosemary, thyme, tỏi, mật ong, tiêu, muối biển",
            "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400",
            List.of()
        );

        createProductWithMedia(
            "Cánh Gà Cay",
            "Cánh gà sốt cay ngọt kiểu Hàn, đậm đà",
            new BigDecimal("45000"),
            categories.get(2),
            true,
            22,
            "Cánh gà, tương ớt Hàn, tỏi băm, mật ong, mè rang",
            "https://images.unsplash.com/photo-1608039829572-9b0e18fe0dd8?w=400",
            List.of(
                buildVariant("Cay vừa", "45000", "45000", 12, true, new String[][]{{"Mức cay", "Cay vừa"}}),
                buildVariant("Cay nhiều", "47000", "47000", 10, false, new String[][]{{"Mức cay", "Cay nhiều"}})
            )
        );

        // Rice
        createProductWithMedia(
            "Cơm Gà",
            "Cơm gà nướng sốt teriyaki, rau củ áp chảo",
            new BigDecimal("40000"),
            categories.get(3),
            true,
            24,
            "Cơm jasmine, ức gà nướng, sốt teriyaki, bông cải, cà rốt",
            "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=400",
            List.of()
        );

        createProductWithMedia(
            "Cơm Bò",
            "Cơm bò xào hành tây, thơm vị tiêu đen",
            new BigDecimal("45000"),
            categories.get(3),
            true,
            20,
            "Cơm trắng, bò lát, hành tây, ớt chuông, sốt tiêu đen",
            "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=400",
            List.of()
        );

        createProductWithMedia(
            "Cơm Hải Sản",
            "Cơm chiên hải sản với tôm, mực và trứng",
            new BigDecimal("55000"),
            categories.get(3),
            true,
            16,
            "Cơm, tôm, mực, trứng gà, đậu Hà Lan, cà rốt, hành lá",
            "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400",
            List.of()
        );

        // Noodles
        createProductWithMedia(
            "Bò Kho",
            "Bò kho mềm thơm ăn cùng mì trứng",
            new BigDecimal("45000"),
            categories.get(4),
            true,
            18,
            "Mì trứng, nạm bò, cà rốt, quế, hồi, sả, gừng",
            "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400",
            List.of()
        );

        createProductWithMedia(
            "Pad Thai",
            "Mì xào kiểu Thái chua ngọt hài hòa",
            new BigDecimal("50000"),
            categories.get(4),
            true,
            15,
            "Bánh phở, tôm, đậu phụ, giá đỗ, hẹ, trứng, sốt me",
            "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400",
            List.of(
                buildVariant("Gà", "50000", "50000", 8, true, new String[][]{{"Topping", "Gà"}}),
                buildVariant("Tôm", "55000", "53000", 7, false, new String[][]{{"Topping", "Tôm"}})
            )
        );

        createProductWithMedia(
            "Ramen",
            "Ramen nước dùng xương hầm đậm vị",
            new BigDecimal("55000"),
            categories.get(4),
            true,
            14,
            "Mì ramen, nước hầm xương, trứng lòng đào, thịt heo chashu, rong biển",
            "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400",
            List.of()
        );

        // Drinks
        createProductWithMedia(
            "Coca Cola",
            "Nước ngọt có gas dùng lạnh",
            new BigDecimal("15000"),
            categories.get(5),
            true,
            50,
            "Nước bão hòa CO2, đường, hương cola",
            "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400",
            List.of(
                buildVariant("Lon", "15000", "15000", 30, true, new String[][]{{"Dung tích", "330ml"}}),
                buildVariant("Chai", "18000", "18000", 20, false, new String[][]{{"Dung tích", "500ml"}})
            )
        );

        createProductWithMedia(
            "Nước Chanh",
            "Nước chanh tươi mát, giảm ngấy khi ăn đồ chiên",
            new BigDecimal("20000"),
            categories.get(5),
            true,
            25,
            "Chanh tươi, đường, nước lọc, lá bạc hà",
            "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400",
            List.of()
        );

        createProductWithMedia(
            "Sinh Tố",
            "Sinh tố trái cây xay với sữa chua",
            new BigDecimal("30000"),
            categories.get(5),
            true,
            20,
            "Chuối, xoài, sữa chua, mật ong, đá viên",
            "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400",
            List.of(
                buildVariant("M", "30000", "30000", 12, true, new String[][]{{"Size", "M"}}),
                buildVariant("L", "35000", "33000", 8, false, new String[][]{{"Size", "L"}})
            )
        );

        // Desserts
        createProductWithMedia(
            "Kem Vani",
            "Kem vani mịn, thơm hương sữa",
            new BigDecimal("20000"),
            categories.get(6),
            true,
            28,
            "Sữa tươi, kem tươi, vani, đường",
            "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400",
            List.of()
        );

        createProductWithMedia(
            "Bánh Sô Cô La",
            "Bánh chocolate ẩm mềm, vị cacao đậm",
            new BigDecimal("35000"),
            categories.get(6),
            true,
            16,
            "Bột mì, cacao, trứng, bơ lạt, sữa tươi, đường",
            "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400",
            List.of()
        );

        createProductWithMedia(
            "Bánh Phô Mai",
            "Cheesecake mềm mịn kiểu New York",
            new BigDecimal("40000"),
            categories.get(6),
            true,
            14,
            "Cream cheese, whipping cream, bơ, bánh quy, đường",
            "https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400",
            List.of()
        );

        // Snacks
        createProductWithMedia(
            "Khoai Tây Chiên",
            "Khoai tây chiên vàng giòn, ăn kèm tương cà",
            new BigDecimal("20000"),
            categories.get(7),
            true,
            35,
            "Khoai tây, muối, tiêu, bột tỏi",
            "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400",
            List.of(
                buildVariant("Nhỏ", "20000", "20000", 20, true, new String[][]{{"Kích cỡ", "Nhỏ"}}),
                buildVariant("Lớn", "30000", "28000", 15, false, new String[][]{{"Kích cỡ", "Lớn"}})
            )
        );

        createProductWithMedia(
            "Hành Tây Chiên",
            "Hành tây vòng chiên giòn thơm",
            new BigDecimal("25000"),
            categories.get(7),
            true,
            22,
            "Hành tây, bột mì, bột chiên xù, trứng, sữa",
            "https://images.unsplash.com/photo-1639024471283-03518883512d?w=400",
            List.of()
        );

        createProductWithMedia(
            "Nachos",
            "Bánh ngô giòn chấm sốt phô mai và salsa",
            new BigDecimal("35000"),
            categories.get(7),
            true,
            18,
            "Bánh tortilla ngô, sốt phô mai, salsa cà chua, jalapeno",
            "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400",
            List.of()
        );
    }

        private void createProductWithMedia(
            String name,
            String description,
            BigDecimal price,
            Category category,
            boolean isAvailable,
            int stock,
            String ingredients,
            String imageUrl,
            List<ProductVariant> variants
        ) {
        Product product = productRepository.save(Product.builder()
                .name(name)
                .description(description)
                .price(price)
            .stock(stock)
                .category(category)
            .ingredients(ingredients)
                .isAvailable(isAvailable)
                .isFeatured(true)
                .isNew(false)
                .build());

        productMediaRepository.save(ProductMedia.builder()
                .product(product)
                .mediaType(ProductMedia.MediaType.IMAGE)
                .mediaUrl(imageUrl)
                .isPrimary(true)
                .displayOrder(0)
                .build());

        if (variants != null && !variants.isEmpty()) {
            boolean hasDefault = variants.stream().anyMatch(v -> Boolean.TRUE.equals(v.getIsDefault()));

            for (int i = 0; i < variants.size(); i++) {
                ProductVariant variant = variants.get(i);
                variant.setProduct(product);
                variant.setSortOrder(i);
                if (!hasDefault && i == 0) {
                    variant.setIsDefault(true);
                }

                if (variant.getAttributes() != null) {
                    variant.getAttributes().forEach(attr -> attr.setVariant(variant));
                }
            }

            productVariantRepository.saveAll(variants);
        }
    }

    private ProductVariant buildVariant(
            String name,
            String originalPrice,
            String salePrice,
            int stock,
            boolean isDefault,
            String[][] attributes
    ) {
        ProductVariant variant = ProductVariant.builder()
                .name(name)
                .originalPrice(new BigDecimal(originalPrice))
                .salePrice(new BigDecimal(salePrice))
                .stock(stock)
                .isDefault(isDefault)
                .build();

        List<ProductVariantAttribute> attributeList = new ArrayList<>();
        for (String[] attr : attributes) {
            if (attr.length < 2) continue;
            attributeList.add(ProductVariantAttribute.builder()
                    .variant(variant)
                    .attributeName(attr[0])
                    .attributeValue(attr[1])
                    .build());
        }
        variant.setAttributes(attributeList);

        return variant;
    }

    private void createCoupons() {
        List<Coupon> coupons = List.of(
            Coupon.builder()
                    .code("WELCOME10")
                    .discountPercent(10)
                    .minOrderAmount(new BigDecimal("50000"))
                    .maxDiscount(new BigDecimal("20000"))
                    .expiryDate(LocalDate.now().plusDays(30))
                    .isActive(true)
                    .build(),
            Coupon.builder()
                    .code("FREESHIP")
                    .discountPercent(100)
                    .minOrderAmount(new BigDecimal("100000"))
                    .maxDiscount(new BigDecimal("15000"))
                    .expiryDate(LocalDate.now().plusDays(14))
                    .isActive(true)
                    .build(),
            Coupon.builder()
                    .code("SAVE20")
                    .discountPercent(20)
                    .minOrderAmount(new BigDecimal("100000"))
                    .maxDiscount(new BigDecimal("50000"))
                    .expiryDate(LocalDate.now().plusDays(7))
                    .isActive(true)
                    .build()
        );

        couponRepository.saveAll(coupons);
    }

    private void createDefaultUsers() {
        createOrUpdateUser("admin@foodhub.com", "admin123", "Administrator", "0123456789", User.Role.ADMIN);
        createOrUpdateUser("user@foodhub.com", "user123", "Test User", "0987654321", User.Role.USER);
    }

    private void createOrUpdateUser(String email, String rawPassword, String fullName, String phone, User.Role role) {
        User user = userRepository.findByEmail(email).orElseGet(User::new);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setFullName(fullName);
        user.setPhone(phone);
        user.setRole(role);
        user.setIsActive(true);
        user.setIsEmailVerified(true);
        userRepository.save(user);
    }
}
