from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

app = Flask(__name__)
CORS(app)


def build_dataframe(all_products):
    df = pd.DataFrame(all_products)
    if df.empty or 'id' not in df.columns:
        return None

    # Các trường văn bản để AI phân tích nội dung món ăn
    text_fields = ['name', 'description', 'categoryName', 'ingredients']
    for col in text_fields:
        if col not in df.columns:
            df[col] = ''
        df[col] = df[col].fillna('').astype(str)

    # Gom tất cả đặc điểm vào một cột nội dung duy nhất
    df['content'] = df['name'] + " " + df['description'] + " " + df['categoryName'] + " " + df['ingredients']
    return df


@app.route('/predict_foryou', methods=['POST'])
def predict_foryou():
    try:
        # Nhận dữ liệu từ Java (Đảm bảo Java gửi history_prefs chứa các score 1, 3, 5)
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify([])

        history_prefs = data.get('history_prefs', [])
        all_products = data.get('all_products', [])

        if not history_prefs or not all_products:
            return jsonify([])

        df = build_dataframe(all_products)
        if df is None: return jsonify([])

        # 1. Vector hóa nội dung bằng TF-IDF
        tfidf = TfidfVectorizer(stop_words=None)  # Với tiếng Việt có thể để None hoặc dùng list riêng
        tfidf_matrix = tfidf.fit_transform(df['content'])

        # 2. Tính toán ma trận độ tương đồng Cosine
        cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

        # 3. Tạo Map điểm số (Lấy điểm cao nhất nếu một món xuất hiện nhiều lần trong lịch sử)
        score_map = {}
        for item in history_prefs:
            pid = str(item['id'])
            score = float(item.get('score', 1.0))
            if pid not in score_map or score > score_map[pid]:
                score_map[pid] = score

        history_ids = list(score_map.keys())

        # 4. Tìm vị trí (index) của các món đã tương tác trong DataFrame
        history_indices = df[df['id'].astype(str).isin(history_ids)].index.tolist()

        if not history_indices:
            return jsonify([])

        # 5. Xây dựng User Profile (Trung bình trọng số các vector món ăn)
        # Những món có score cao (Mua = 5) sẽ ảnh hưởng nhiều nhất đến Profile
        vectors = []
        weights = []
        for idx in history_indices:
            prod_id_str = str(df.iloc[idx]['id'])
            vectors.append(cosine_sim[idx])
            weights.append(score_map.get(prod_id_str, 1.0))

        # Vector đại diện cho toàn bộ sở thích của User
        user_profile = np.average(vectors, axis=0, weights=weights)

        # 6. So sánh User Profile với toàn bộ món ăn trong Menu
        sim_scores = list(enumerate(user_profile))
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

        recommended_ids = []
        history_set = set(history_ids)

        # Lấy top 8 món giống với sở thích nhất nhưng chưa từng tương tác
        for i, score in sim_scores:
            prod_id_raw = df.iloc[i]['id']
            if str(prod_id_raw) not in history_set:
                recommended_ids.append(int(prod_id_raw))
            if len(recommended_ids) >= 8:
                break

        print(f"Hành vi nhận diện: {len(history_ids)} món | Gợi ý: {recommended_ids}")
        return jsonify(recommended_ids)

    except Exception as e:
        print(f"Lỗi AI gợi ý: {e}")
        return jsonify([])


if __name__ == '__main__':
    # Chạy trên port 5000 để Java gọi sang
    app.run(host='0.0.0.0', port=5000, debug=False)