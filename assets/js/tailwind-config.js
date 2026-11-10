tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        ink: { DEFAULT: '#14201C', soft: '#4B5A54', mute: '#7B8883' },
                        matcha: { 50: '#F3F7F0', 100: '#E4EDDD', 200: '#C9DABB', 500: '#7C9A6A', 600: '#5F7F4E', 700: '#2F5A4B', 800: '#1F433A', 900: '#14302A' },
                        berry: { 50: '#FEF3F4', 100: '#FBE1E4', 400: '#E58C97', 500: '#D96B7A', 600: '#C04F61' },
                        line: '#E7EAE6',
                        paper: '#FAFAF8'
                    },
                    fontFamily: {
                        sans: ['Inter', 'system-ui', 'sans-serif'],
                        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif']
                    },
                    boxShadow: {
                        card: '0 1px 2px rgba(20,32,28,.04), 0 4px 16px rgba(20,32,28,.04)',
                        lift: '0 2px 4px rgba(20,32,28,.05), 0 16px 40px rgba(20,32,28,.10)'
                    }
                }
            }
        }
